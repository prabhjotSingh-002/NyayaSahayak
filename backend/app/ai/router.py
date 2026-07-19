import warnings
import asyncio
import re
warnings.filterwarnings("ignore", category=FutureWarning)

import httpx
import google.generativeai as genai
from typing import List, Optional
from app.config import settings

# Fallback chain for LLM providers
FALLBACK_CHAIN = [
    {"provider": "gemini",     "model": "gemini-3.1-flash-lite",                     "ctx": 1048576, "task": "all"},
    {"provider": "gemini",     "model": "gemini-flash-latest",                       "ctx": 1048576, "task": "all"},
    {"provider": "gemini",     "model": "gemini-3.5-flash",                          "ctx": 1048576, "task": "all"},

    {"provider": "groq",       "model": "qwen/qwen3.6-27b",                          "ctx": 128000,  "task": "all"},
    {"provider": "groq",       "model": "llama-3.3-70b-versatile",                   "ctx": 128000,  "task": "all"},
    {"provider": "groq",       "model": "groq/compound-mini",                        "ctx": 128000,  "task": "all"},

    {"provider": "openrouter", "model": "nvidia/nemotron-3-super-120b-a12b:free",     "ctx": 131072,  "task": "all"},
    {"provider": "openrouter", "model": "nvidia/nemotron-3-ultra-550b-a55b:free",     "ctx": 131072,  "task": "all"},
    {"provider": "openrouter", "model": "nvidia/nemotron-3-nano-30b-a3b:free",        "ctx": 131072,  "task": "all"},
    {"provider": "openrouter", "model": "openrouter/auto",                           "ctx": 8192,    "task": "chat"},
]


class AIRouter:
    def __init__(self):
        self.openrouter_key = settings.OPENROUTER_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.groq_key = settings.GROQ_API_KEY
        
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)

    async def generate_response(
        self,
        prompt: str,
        system_prompt: str = "",
        task: str = "all",
        messages: Optional[List[dict]] = None,
    ) -> str:
        """Tries each provider model in sequence and returns the first response."""
        chain = [m for m in FALLBACK_CHAIN if m["task"] in (task, "all")]
        
        for config in chain:
            try:
                if config["provider"] == "openrouter" and not self.openrouter_key:
                    continue
                if config["provider"] == "groq" and not self.groq_key:
                    continue
                if config["provider"] == "gemini" and not self.gemini_key:
                    continue
                    
                response = await self._call_provider(
                    provider=config["provider"],
                    model=config["model"],
                    prompt=prompt,
                    system_prompt=system_prompt,
                    messages=messages
                )
                if response and len(response.strip()) > 0:
                    return response
                    
            except Exception as e:
                print(f"[AIRouter] {config['provider']}/{config['model']} failed: {type(e).__name__}: {e}")
                continue
        
        raise Exception("All AI providers in the fallback chain failed. Check your API keys in .env")

    async def _call_provider(
        self,
        provider: str,
        model: str,
        prompt: str,
        system_prompt: str,
        messages: Optional[List[dict]] = None
    ) -> str:
        if provider == "openrouter":
            return await self._call_openrouter(model, prompt, system_prompt, messages)
        elif provider == "groq":
            return await self._call_groq(model, prompt, system_prompt, messages)
        elif provider == "gemini":
            return await self._call_gemini(model, prompt, system_prompt)
        return ""

    async def _call_openrouter(self, model: str, prompt: str, system_prompt: str, messages=None) -> str:
        msg_list = self._build_messages(prompt, system_prompt, messages)
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "HTTP-Referer": "https://nyayasahayak.app",
                    "X-Title": "NyayaSahayak"
                },
                json={"model": model, "messages": msg_list, "max_tokens": 4096}
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def _call_groq(self, model: str, prompt: str, system_prompt: str, messages=None) -> str:
        msg_list = self._build_messages(prompt, system_prompt, messages)
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.groq_key}"},
                json={"model": model, "messages": msg_list, "max_tokens": 4096}
            )
            resp.raise_for_status()
            raw_text = resp.json()["choices"][0]["message"]["content"]
            # Clean reasoning tags from models like Qwen
            clean_text = re.sub(r'<think>.*?</think>', '', raw_text, flags=re.DOTALL).strip()
            return clean_text

    async def _call_gemini(self, model: str, prompt: str, system_prompt: str) -> str:
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        gemini_model = genai.GenerativeModel(model)
        # Execute blocking generate call in a separate thread executor
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: gemini_model.generate_content(full_prompt)
        )
        return response.text

    def _build_messages(self, prompt: str, system_prompt: str, messages=None) -> List[dict]:
        msg_list = []
        if system_prompt:
            msg_list.append({"role": "system", "content": system_prompt})
        if messages:
            msg_list.extend(messages)
        msg_list.append({"role": "user", "content": prompt})
        return msg_list


ai_router = AIRouter()
