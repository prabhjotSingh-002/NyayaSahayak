import os
import tempfile
import json
import io
import uuid
import asyncio
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
from app.dependencies import get_current_user_uuid
from app.models.database import supabase
from app.config import settings
from app.services.document_parser import DocumentParser
from app.services.contract_analyzer import ContractAnalyzer

router = APIRouter(prefix="/documents", tags=["documents"])

async def embed_and_store_document(doc_id: str, extracted_text: str):
    """Chunks the document text, computes vectors, and inserts them into Supabase."""
    if not extracted_text or not extracted_text.strip():
        return

    pages = extracted_text.split("\n\n--- PAGE BREAK ---\n\n")
    chunks = []
    chunk_idx = 0

    for page_num, page_text in enumerate(pages):
        page_text = page_text.strip()
        if not page_text:
            continue
        
        # Segment large pages into chunks of 1500 chars with 200 character overlap
        max_chars = 1500
        overlap = 200
        
        if len(page_text) <= max_chars:
            page_chunks = [page_text]
        else:
            page_chunks = []
            start = 0
            while start < len(page_text):
                end = start + max_chars
                page_chunks.append(page_text[start:end])
                start += max_chars - overlap

        for chunk_txt in page_chunks:
            chunk_txt = chunk_txt.strip()
            if chunk_txt:
                chunks.append({
                    "document_id": doc_id,
                    "chunk_index": chunk_idx,
                    "chunk_text": chunk_txt,
                    "page_number": page_num + 1,
                    "token_count": max(1, len(chunk_txt) // 4)
                })
                chunk_idx += 1

    if not chunks:
        return

    texts_to_embed = [c["chunk_text"] for c in chunks]
    
    from app.services.embedding import EmbeddingService
    try:
        embeddings = await EmbeddingService.embed_texts(texts_to_embed)
        
        for idx, emb in enumerate(embeddings):
            chunks[idx]["embedding"] = emb
            
        supabase.table("document_chunks").insert(chunks).execute()
        print(f"[Embedding] Successfully embedded and stored {len(chunks)} chunks for doc {doc_id}")
    except Exception as e:
        print(f"[Embedding] Error embedding document chunks for doc {doc_id}: {e}")


async def process_document_async(doc_id: str, tmp_path: str, content_type: str, doc_type: str):
    """Background task to extract text and trigger analysis."""
    try:
        extracted_text = ""
        
        if content_type == "application/pdf":
            loop = asyncio.get_event_loop()
            parse_result = await loop.run_in_executor(
                None,
                lambda: DocumentParser.extract_text_from_pdf(tmp_path, doc_id=doc_id)
            )
            if parse_result.get("success"):
                extracted_text = parse_result.get("text", "")
        elif content_type == "text/plain":
            try:
                with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                    extracted_text = f.read()
                supabase.table("documents").update({
                    "extracted_text": extracted_text,
                    "page_count": 1
                }).eq("id", doc_id).execute()
                print(f"[documents] TXT file read successfully, {len(extracted_text)} chars.")
            except Exception as e:
                print(f"[documents] TXT read failed: {e}")
        elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            try:
                from docx import Document as DocxDocument
                doc = DocxDocument(tmp_path)
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                extracted_text = "\n".join(paragraphs)
                supabase.table("documents").update({
                    "extracted_text": extracted_text,
                    "page_count": 1
                }).eq("id", doc_id).execute()
                print(f"[documents] DOCX extracted successfully, {len(extracted_text)} chars.")
            except ImportError:
                print("[documents] python-docx not installed.")
                supabase.table("documents").update({"analysis_status": "failed"}).eq("id", doc_id).execute()
                return
            except Exception as e:
                print(f"[documents] DOCX extraction failed: {e}")
        else:
            with open(tmp_path, "rb") as f:
                img_bytes = f.read()
                
            extracted_text = ""
            
            try:
                import cv2
                import numpy as np
                from PIL import Image
                
                nparr = np.frombuffer(img_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                denoised = cv2.fastNlMeansDenoising(gray, h=10)
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                cl = clahe.apply(denoised)
                
                thresh = cv2.threshold(cl, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
                coords = np.column_stack(np.where(thresh > 0))
                if len(coords) > 0:
                    angle = cv2.minAreaRect(coords)[-1]
                    if angle < -45:
                        angle = -(90 + angle)
                    elif angle > 45:
                        angle = 90 - angle
                    if 0.1 <= abs(angle) <= 45:
                        (h, w) = cl.shape[:2]
                        center = (w // 2, h // 2)
                        M = cv2.getRotationMatrix2D(center, angle, 1.0)
                        cl = cv2.warpAffine(cl, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                
                final_thresh = cv2.threshold(cl, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
                processed_img = Image.fromarray(final_thresh)
            except Exception as e:
                print(f"[documents] Image preprocessing failed: {e}")
                from PIL import Image
                processed_img = Image.open(io.BytesIO(img_bytes))
                
            try:
                import pytesseract
                data = pytesseract.image_to_data(processed_img, output_type=pytesseract.Output.DICT)
                confidences = [int(c) for c in data['conf'] if c != '-1']
                avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
                if avg_conf >= 75:
                    extracted_text = pytesseract.image_to_string(processed_img).strip()
                    print(f"[documents] Single image Tesseract succeeded with {avg_conf:.1f}% confidence.")
            except Exception as tess_err:
                print(f"[documents] Single image Tesseract failed: {tess_err}")
                
            # OCR fallback models list
            OCR_FALLBACK_CHAIN = [
                "gemini-3.1-flash-lite",
                "gemini-flash-lite-latest",
                "gemini-flash-latest",
                "gemini-3.5-flash",
            ]
            if not extracted_text and settings.GEMINI_API_KEY:
                try:
                    from google import genai as google_genai
                    from google.genai import types

                    client = google_genai.Client(api_key=settings.GEMINI_API_KEY)

                    buf = io.BytesIO()
                    processed_img.save(buf, format="PNG")
                    processed_bytes = buf.getvalue()

                    for model_name in OCR_FALLBACK_CHAIN:
                        try:
                            print(f"[documents] Single image OCR: Trying [{model_name}]...")
                            response = client.models.generate_content(
                                model=model_name,
                                contents=[
                                    types.Part.from_bytes(
                                        data=processed_bytes,
                                        mime_type='image/png',
                                    ),
                                    "Extract all text from this document image. Preserve formatting."
                                ]
                            )
                            if response.text:
                                extracted_text = response.text.strip()
                                print(f"[documents] Single image OCR succeeded via [{model_name}].")
                                break
                        except Exception as model_err:
                            err_str = str(model_err)
                            if "429" in err_str or "quota" in err_str.lower() or "rate" in err_str.lower():
                                print(f"[documents] [{model_name}] rate limited. Trying next model...")
                                continue
                            print(f"[documents] [{model_name}] failed: {model_err}. Trying next model...")
                            continue
                except Exception as e:
                    print(f"[documents] Single image Gemini OCR chain failed: {e}")
            
            supabase.table("documents").update({
                "extracted_text": extracted_text or "[Scanned Image — No Text Extracted]",
                "page_count": 1
            }).eq("id", doc_id).execute()
        
        if extracted_text:
            await embed_and_store_document(doc_id, extracted_text)

        if doc_type == "contract" and extracted_text:
            await run_contract_analysis(doc_id, extracted_text)
        else:
            ai_summary = None
            if extracted_text and extracted_text.strip():
                try:
                    from app.ai.router import ai_router
                    doc_snippet = extracted_text[:4000]
                    summary_prompt = (
                        f"Analyze the following legal document content (first 4000 chars) and generate a brief 2-3 sentence summary.\n"
                        f"Focus on the main parties, core legal issue, and key arguments or facts.\n"
                        f"Format the summary to be professional, clear, and written in English.\n\n"
                        f"Content:\n{doc_snippet}"
                    )
                    ai_summary = await ai_router.generate_response(
                        prompt=summary_prompt,
                        system_prompt="You are a legal assistant summarizing documents. Keep responses under 100 words."
                    )
                    ai_summary = ai_summary.strip()
                except Exception as e:
                    print(f"[documents] Failed to generate AI summary for doc {doc_id}: {e}")

            update_payload = {"analysis_status": "completed"}
            if ai_summary:
                update_payload["ai_summary"] = ai_summary

            supabase.table("documents").update(update_payload).eq("id", doc_id).execute()
            
        doc_res = supabase.table("documents").select("case_id").eq("id", doc_id).single().execute()
        if doc_res.data and doc_res.data.get("case_id"):
            from app.services.case_analyzer import CaseAnalyzer
            await CaseAnalyzer.evaluate_case(doc_res.data["case_id"])
            
    except Exception as exc:
        print(f"Error in process_document_async for doc {doc_id}: {exc}")
        supabase.table("documents").update({"analysis_status": "failed"}).eq("id", doc_id).execute()
    finally:
        try:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
        except Exception as e:
            print(f"Error deleting temp file {tmp_path}: {e}")

ALLOWED_CONTENT_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None),
    doc_type: str = Form("contract"),
    user_id: str = Depends(get_current_user_uuid)
):
    """Upload a document, store in Supabase, and start OCR and analysis in the background."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, JPEG, PNG, TXT, and DOCX files are supported.")
    
    contents = await file.read()
    file_size = len(contents)

    # Validate file size is less than 20MB limit
    MAX_FILE_SIZE = 20 * 1024 * 1024
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file_size // (1024*1024)}MB). Maximum allowed size is 20MB."
        )

    # Upload document binary to Supabase Storage
    doc_id = str(uuid.uuid4())
    storage_path = f"documents/{user_id}/{doc_id}/{file.filename}"
    try:
        supabase.storage.from_("documents").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
    except Exception as e:
        print(f"Storage upload warning: {e}")

    SUFFIX_MAP = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "text/plain": ".txt",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    }
    suffix = SUFFIX_MAP.get(file.content_type, ".pdf")
    
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    doc_data = {
        "id": doc_id,
        "user_id": user_id,
        "case_id": case_id,
        "filename": file.filename,
        "storage_path": storage_path,
        "mime_type": file.content_type,
        "file_size_bytes": file_size,
        "page_count": 0,
        "doc_type": doc_type,
        "extracted_text": "",
        "analysis_status": "processing"
    }
    result = supabase.table("documents").insert(doc_data).execute()
    if not result.data:
        try:
            os.unlink(tmp_path)
        except:
            pass
        raise HTTPException(status_code=500, detail="Failed to save document record.")
    
    background_tasks.add_task(process_document_async, doc_id, tmp_path, file.content_type, doc_type)

    return {
        "id": doc_id,
        "filename": file.filename,
        "page_count": 0,
        "analysis_status": "processing",
        "message": "Document uploaded. OCR and analysis started in background."
    }

async def run_contract_analysis(doc_id: str, text: str):
    """Background task to run AI analysis and update the document record."""
    try:
        supabase.table("documents").update({"analysis_status": "processing"}).eq("id", doc_id).execute()
        
        analysis = await ContractAnalyzer.analyze_contract(text)
        
        if analysis["success"]:
            data = analysis["data"]
            overall_risk = data.get("overall_risk_score", 0.5)
            
            supabase.table("documents").update({
                "analysis_status": "completed",
                "overall_risk_score": overall_risk,
                "ai_summary": json.dumps(data)
            }).eq("id", doc_id).execute()
            
            clauses_to_insert = []
            for clause in data.get("clauses", []):
                clauses_to_insert.append({
                    "document_id": doc_id,
                    "clause_type": clause.get("type", "Unknown"),
                    "clause_text": clause.get("text", ""),
                    "risk_level": clause.get("risk", "medium"),
                    "risk_score": clause.get("risk_score") if clause.get("risk_score") is not None else {"low": 0.2, "medium": 0.5, "high": 0.85}.get(clause.get("risk", "medium"), 0.5),
                    "explanation": clause.get("explanation", ""),
                    "relevant_law": clause.get("relevant_law", ""),
                    "talking_points": clause.get("talking_points", []),
                    "standard_practice": clause.get("standard_practice", "")
                })
            if clauses_to_insert:
                try:
                    supabase.table("clauses").insert(clauses_to_insert).execute()
                except Exception as db_err:
                    print(f"Failed to insert with new columns, retrying with fallback columns: {db_err}")
                    fallback_clauses = []
                    for c in clauses_to_insert:
                        fc = c.copy()
                        fc.pop("talking_points", None)
                        fc.pop("standard_practice", None)
                        fallback_clauses.append(fc)
                    supabase.table("clauses").insert(fallback_clauses).execute()

            doc_res = supabase.table("documents").select("case_id").eq("id", doc_id).single().execute()
            if doc_res.data and doc_res.data.get("case_id"):
                from app.services.case_analyzer import CaseAnalyzer
                await CaseAnalyzer.evaluate_case(doc_res.data["case_id"])
        else:
            supabase.table("documents").update({"analysis_status": "failed"}).eq("id", doc_id).execute()
    except Exception as e:
        print(f"Background analysis error for doc {doc_id}: {e}")
        supabase.table("documents").update({"analysis_status": "failed"}).eq("id", doc_id).execute()


@router.get("/{doc_id}/analysis")
async def get_document_analysis(doc_id: str, user_id: str = Depends(get_current_user_uuid)):
    """Fetch analysis results for the document."""
    doc_result = supabase.table("documents").select("*").eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not doc_result.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    doc = doc_result.data
    clauses = []
    if doc["analysis_status"] == "completed":
        try:
            summary_str = doc.get("ai_summary", "")
            if summary_str and (summary_str.strip().startswith("{") or summary_str.strip().startswith("[")):
                summary_data = json.loads(summary_str)
                if isinstance(summary_data, dict) and "clauses" in summary_data:
                    clauses = summary_data["clauses"]
        except Exception as e:
            print(f"Error parsing ai_summary JSON (falling back to database): {e}")
            
        if not clauses:
            clause_result = supabase.table("clauses").select("*").eq("document_id", doc_id).execute()
            clauses = clause_result.data or []
    
    return {
        "id": doc["id"],
        "filename": doc["filename"],
        "analysis_status": doc["analysis_status"],
        "overall_risk_score": doc.get("overall_risk_score"),
        "ai_summary": doc.get("ai_summary"),
        "clauses": clauses
    }


@router.get("")
@router.get("/")
async def list_documents(user_id: str = Depends(get_current_user_uuid), case_id: Optional[str] = None):
    """List all documents for the current user."""
    query = supabase.table("documents").select("id, filename, doc_type, analysis_status, overall_risk_score, created_at").eq("user_id", user_id)
    if case_id:
        query = query.eq("case_id", case_id)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, user_id: str = Depends(get_current_user_uuid)):
    """Delete a document, its RAG chunks, and update the parent case metrics."""
    doc_res = supabase.table("documents").select("id, case_id").eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not doc_res.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    case_id = doc_res.data.get("case_id")

    try:
        supabase.table("document_chunks").delete().eq("document_id", doc_id).execute()
    except Exception as e:
        print(f"[delete_document] Failed to delete chunks: {e}")

    try:
        supabase.table("clauses").delete().eq("document_id", doc_id).execute()
    except Exception as e:
        print(f"[delete_document] Failed to delete clauses: {e}")

    supabase.table("documents").delete().eq("id", doc_id).eq("user_id", user_id).execute()

    if case_id:
        try:
            from app.services.case_analyzer import CaseAnalyzer
            await CaseAnalyzer.evaluate_case(case_id)
        except Exception as e:
            print(f"[delete_document] Case re-evaluation failed: {e}")

    return {"message": "Document deleted successfully.", "doc_id": doc_id, "case_id": case_id}
