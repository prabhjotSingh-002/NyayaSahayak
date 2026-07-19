"""
EmbeddingService — NyayaSahayak
Converts legal text chunks into 768-dimensional vector embeddings.
"""

import asyncio
import hashlib
import time
import httpx
from typing import List, Optional
from app.config import settings


# Share RPM and TPM trackers across active requests
_tpm_tracker: List[float] = []
_rpm_tracker: List[float] = []
_tokens_this_minute: int = 0
_GEMINI_TPM_LIMIT = 28000
_GEMINI_RPM_LIMIT = 95


def _count_tokens_approx(text: str) -> int:
    return max(1, len(text) // 4)


async def _wait_for_rate_limit(token_count: int) -> None:
    now = time.time()
    
    global _tpm_tracker, _rpm_tracker, _tokens_this_minute
    _rpm_tracker = [t for t in _rpm_tracker if now - t < 60]
    
    recent_tokens = sum(
        _count_tokens_approx("x" * 100)
        for t in _tpm_tracker if now - t < 60
    )
    
    if len(_rpm_tracker) >= _GEMINI_RPM_LIMIT:
        oldest = _rpm_tracker[0]
        wait_secs = 61 - (now - oldest)
        if wait_secs > 0:
            print(f"[EmbeddingService] RPM limit reached. Waiting {wait_secs:.1f}s...")
            await asyncio.sleep(wait_secs)
    
    _rpm_tracker.append(time.time())


class EmbeddingService:
    EMBEDDING_DIM = 768

    @staticmethod
    async def embed_text(text: str) -> List[float]:
        """Embed a single text string."""
        results = await EmbeddingService.embed_texts([text])
        return results[0]

    @staticmethod
    async def embed_texts(texts: List[str]) -> List[List[float]]:
        """Embed a batch of texts using Gemini API."""
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY not in ('', 'AIza...'):
            return await EmbeddingService._embed_gemini_batch(texts)
        
        print("WARNING: Gemini API Key not configured. Using zero vectors.")
        return [[0.0] * EmbeddingService.EMBEDDING_DIM for _ in texts]

    @staticmethod
    async def _embed_gemini_batch(texts: List[str]) -> List[List[float]]:
        """Embeds text using Google Gemini Client with batch sizing fallbacks."""
        # Truncate each text to safe limit of 8000 characters
        texts = [t[:8000] for t in texts]

        from google import genai as google_genai
        from google.genai import types
        import re

        client = google_genai.Client(api_key=settings.GEMINI_API_KEY)
        results = [None] * len(texts)
        
        async def embed_slice(start: int, count: int) -> Optional[List[List[float]]]:
            batch_texts = texts[start:start + count]
            contents_list = [
                types.Content(parts=[types.Part.from_text(text=t)])
                for t in batch_texts
            ]
            
            retries = 3
            delay = 5.0
            for attempt in range(retries):
                try:
                    loop = asyncio.get_event_loop()
                    response = await loop.run_in_executor(
                        None,
                        lambda: client.models.embed_content(
                            model=settings.GEMINI_EMBEDDING_MODEL,
                            contents=contents_list,
                            config=types.EmbedContentConfig(output_dimensionality=768)
                        )
                    )
                    return [list(emb.values) for emb in response.embeddings]
                except Exception as e:
                    err_msg = str(e).lower()
                    if "429" in err_msg or "resource_exhausted" in err_msg or "rate limit" in err_msg:
                        wait_time = delay * (2 ** attempt)
                        match = re.search(r"retry in (\d+(?:\.\d+)?)s", err_msg)
                        if match:
                            wait_time = float(match.group(1)) + 1.0
                        print(f"[EmbeddingService] Rate limit (429) on batch size {count}. Waiting {wait_time:.1f}s... (Attempt {attempt+1}/{retries})")
                        await asyncio.sleep(wait_time)
                    else:
                        print(f"[EmbeddingService] API error on batch size {count}: {e}")
                        return None
            return None

        # 90 chunk primary batching
        outer_batch_size = 90
        for idx in range(0, len(texts), outer_batch_size):
            chunk_texts = texts[idx:idx + outer_batch_size]
            count = len(chunk_texts)
            print(f"[EmbeddingService] Processing outer batch {idx + 1} to {idx + count} (size {count})...")
            
            batch_results = await embed_slice(idx, count)
            if batch_results and len(batch_results) == count:
                for offset, emb in enumerate(batch_results):
                    results[idx + offset] = emb
                print(f"[EmbeddingService] Successfully embedded outer batch {idx + 1} to {idx + count}")
                await asyncio.sleep(3.0)
            else:
                print(f"[EmbeddingService] Outer batch {idx + 1} to {idx + count} failed. Falling back to smaller batches of 30...")
                
                # 30 chunk secondary fallback
                sub_batch_size = 30
                for sub_idx in range(idx, idx + count, sub_batch_size):
                    sub_count = min(sub_batch_size, idx + count - sub_idx)
                    print(f"[EmbeddingService] Embedding sub-batch {sub_idx + 1} to {sub_idx + sub_count} (size {sub_count})...")
                    
                    await asyncio.sleep(2.0)
                    sub_results = await embed_slice(sub_idx, sub_count)
                    if sub_results and len(sub_results) == sub_count:
                        for offset, emb in enumerate(sub_results):
                            results[sub_idx + offset] = emb
                        print(f"[EmbeddingService] Successfully embedded sub-batch {sub_idx + 1} to {sub_idx + sub_count}")
                    else:
                        print(f"[EmbeddingService] Sub-batch {sub_idx + 1} to {sub_idx + sub_count} failed. Falling back to one-by-one...")
                        
                        # One-by-one item fallback
                        for single_idx in range(sub_idx, sub_idx + sub_count):
                            t = texts[single_idx]
                            single_emb = None
                            
                            retries = 4
                            delay = 3.0
                            for attempt in range(retries):
                                try:
                                    await asyncio.sleep(0.8)
                                    loop = asyncio.get_event_loop()
                                    response = await loop.run_in_executor(
                                        None,
                                        lambda text_val=t: client.models.embed_content(
                                            model=settings.GEMINI_EMBEDDING_MODEL,
                                            contents=text_val,
                                            config=types.EmbedContentConfig(output_dimensionality=768)
                                        )
                                    )
                                    single_emb = list(response.embeddings[0].values)
                                    break
                                except Exception as single_e:
                                    single_err = str(single_e).lower()
                                    if "429" in single_err or "resource_exhausted" in single_err or "rate limit" in single_err:
                                        wait_time = delay * (2 ** attempt)
                                        match = re.search(r"retry in (\d+(?:\.\d+)?)s", single_err)
                                        if match:
                                            wait_time = float(match.group(1)) + 1.0
                                        print(f"[EmbeddingService] Rate limit (429) on single chunk {single_idx}. Waiting {wait_time:.1f}s... (Attempt {attempt+1}/{retries})")
                                        await asyncio.sleep(wait_time)
                                    else:
                                        print(f"[EmbeddingService] API error on single chunk {single_idx}: {single_e}")
                                        break
                            if single_emb:
                                results[single_idx] = single_emb
                            else:
                                print(f"[EmbeddingService] Single chunk {single_idx} failed all retries. Using zero vector fallback.")
                                results[single_idx] = [0.0] * EmbeddingService.EMBEDDING_DIM
                             
        return results

    @staticmethod
    def compute_chunk_hash(text: str) -> str:
        return hashlib.md5(text.encode('utf-8')).hexdigest()[:16]
