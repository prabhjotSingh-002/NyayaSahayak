# Case Management API Router
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from typing import List, Optional
from datetime import datetime, timezone
from app.dependencies import get_current_user_uuid
from app.models.database import supabase
from app.models.schemas import CaseCreate
from app.rate_limiter import limiter

router = APIRouter(prefix="/cases", tags=["cases"])

def parse_case_summary(case_dict: dict) -> dict:
    """Helper to separate user notes from AI context summaries."""
    if not case_dict:
        return case_dict
    summary_field = case_dict.get("ai_context_summary") or ""
    notes = ""
    ai_summary = ""
    
    if "--- USER DESCRIPTION ---" in summary_field:
        parts = summary_field.split("--- USER DESCRIPTION ---")
        content = parts[1] if len(parts) > 1 else ""
        if "--- AI SUMMARY ---" in content:
            subparts = content.split("--- AI SUMMARY ---")
            notes = subparts[0].strip()
            ai_summary = subparts[1].strip()
        else:
            notes = content.strip()
            ai_summary = ""
    else:
        ai_summary = summary_field
        notes = ""

    case_dict["notes"] = notes
    case_dict["ai_context_summary"] = ai_summary or "No context summary generated yet."
    return case_dict

@router.post("")
@router.post("/")
async def create_case(case_data: CaseCreate, user_id: str = Depends(get_current_user_uuid)):
    """Create a new case for the user."""
    dump = case_data.model_dump()
    notes = dump.pop("notes", None)
    
    insert_data = {
        **dump,
        "user_id": user_id,
        "current_status": "active"
    }
    if notes:
        insert_data["ai_context_summary"] = f"--- USER DESCRIPTION ---\n{notes}"
        
    result = supabase.table("cases").insert(insert_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create case.")
    
    case_id = result.data[0]["id"]
    from app.services.case_analyzer import CaseAnalyzer
    await CaseAnalyzer.evaluate_case(case_id)
    
    fresh_res = supabase.table("cases").select("*").eq("id", case_id).single().execute()
    return parse_case_summary(fresh_res.data or result.data[0])


@router.get("")
@router.get("/")
async def list_cases(user_id: str = Depends(get_current_user_uuid)):
    """List all non-archived cases for the current user."""
    result = (
        supabase.table("cases")
        .select("*")
        .eq("user_id", user_id)
        .neq("current_status", "archived")
        .order("created_at", desc=True)
        .execute()
    )
    cases = result.data or []
    if not cases:
        return []
        
    case_ids = [c["id"] for c in cases]
    
    docs_res = supabase.table("documents").select("id", "case_id", "filename", "mime_type", "file_size_bytes", "analysis_status").in_("case_id", case_ids).execute()
    docs = docs_res.data or []
    
    hearings_res = supabase.table("hearings").select("id", "case_id", "hearing_date", "court_order_summary", "notes", "created_at").in_("case_id", case_ids).execute()
    hearings = hearings_res.data or []
    
    docs_by_case = {}
    for d in docs:
        cid = d["case_id"]
        if cid not in docs_by_case:
            docs_by_case[cid] = []
        docs_by_case[cid].append(d)
        
    hearings_by_case = {}
    for h in hearings:
        cid = h["case_id"]
        if cid not in hearings_by_case:
            hearings_by_case[cid] = []
        hearings_by_case[cid].append(h)
        
    for c in cases:
        c["documents"] = docs_by_case.get(c["id"], [])
        c["hearings"] = hearings_by_case.get(c["id"], [])
        
    return [parse_case_summary(c) for c in cases]


@router.get("/{case_id}")
async def get_case(case_id: str, user_id: str = Depends(get_current_user_uuid)):
    """Get a specific case with all its related data."""
    case_result = supabase.table("cases").select("*").eq("id", case_id).eq("user_id", user_id).single().execute()
    if not case_result.data:
        raise HTTPException(status_code=404, detail="Case not found.")
    
    case = parse_case_summary(case_result.data)
    
    docs = supabase.table("documents").select(
        "id, filename, doc_type, analysis_status, overall_risk_score, created_at, mime_type, file_size_bytes, ai_summary"
    ).eq("case_id", case_id).execute()
    
    hearings = supabase.table("hearings").select("*").eq("case_id", case_id).order("hearing_date", desc=True).execute()
    
    return {
        **case,
        "documents": docs.data or [],
        "hearings": hearings.data or []
    }


@router.patch("/{case_id}")
async def update_case(case_id: str, updates: dict = Body(...), user_id: str = Depends(get_current_user_uuid)):
    """Partially update a case."""
    allowed = {"case_title", "case_number", "court_name", "judge_name", "next_hearing_date", "current_status", "petitioner", "respondent", "notes"}
    safe_updates = {k: v for k, v in updates.items() if k in allowed}
    if not safe_updates:
        raise HTTPException(status_code=400, detail="No valid fields to update.")
        
    notes = safe_updates.pop("notes", None)
    if notes is not None:
        safe_updates["ai_context_summary"] = f"--- USER DESCRIPTION ---\n{notes}"
        
    safe_updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = supabase.table("cases").update(safe_updates).eq("id", case_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Case not found or update failed.")
        
    if notes is not None or "court_name" in safe_updates:
        from app.services.case_analyzer import CaseAnalyzer
        await CaseAnalyzer.evaluate_case(case_id)
        result = supabase.table("cases").select("*").eq("id", case_id).eq("user_id", user_id).execute()
        
    return parse_case_summary(result.data[0])


@router.delete("/{case_id}")
async def delete_case(case_id: str, user_id: str = Depends(get_current_user_uuid)):
    """Hard-delete a case and all associated data."""
    case = supabase.table("cases").select("id").eq("id", case_id).eq("user_id", user_id).single().execute()
    if not case.data:
        raise HTTPException(status_code=404, detail="Case not found.")

    docs_res = supabase.table("documents").select("id").eq("case_id", case_id).execute()
    doc_ids = [d["id"] for d in (docs_res.data or [])]

    for doc_id in doc_ids:
        try:
            supabase.table("document_chunks").delete().eq("document_id", doc_id).execute()
        except Exception as e:
            print(f"[delete_case] Failed to delete chunks for doc {doc_id}: {e}")

    if doc_ids:
        supabase.table("documents").delete().eq("case_id", case_id).execute()

    try:
        supabase.table("hearings").delete().eq("case_id", case_id).execute()
    except Exception as e:
        print(f"[delete_case] Failed to delete hearings: {e}")

    supabase.table("cases").delete().eq("id", case_id).eq("user_id", user_id).execute()

    return {"message": "Case and all associated data permanently deleted.", "case_id": case_id}


@router.post("/{case_id}/hearings")
async def add_hearing(case_id: str, hearing_data: dict = Body(...), user_id: str = Depends(get_current_user_uuid)):
    """Add a hearing record and trigger updates."""
    case = supabase.table("cases").select("id").eq("id", case_id).eq("user_id", user_id).single().execute()
    if not case.data:
        raise HTTPException(status_code=404, detail="Case not found.")
    
    desc = hearing_data.get("court_order_summary") or ""
    if desc.strip():
        try:
            from app.ai.router import ai_router
            prompt = (
                "Translate the following legal update into clean English (if written in Hinglish, Hindi, or any other language) and return it.\n"
                "Follow these instructions:\n"
                "1. If the input is short (under 40 words), keep all facts, details, and context. Do not shorten it or lose any information.\n"
                "2. If the input is long (more than 40 words), summarize it into a concise, professional version that is proportionate to the input length, making sure all critical dates, names, events, and facts are preserved.\n"
                "3. Ensure the output is entirely in clear, professional English.\n"
                "4. Output ONLY the resulting translated/summarized text without any introduction or markdown wrappers.\n\n"
                f"Input text:\n{desc}"
            )
            summary = await ai_router.generate_response(
                prompt=prompt,
                system_prompt="You are a professional legal assistant specializing in translation and proportionate summarization. Output only the final translated/summarized text."
            )
            hearing_data["court_order_summary"] = summary.strip()
            hearing_data["notes"] = desc
        except Exception as e:
            print(f"Failed to summarize hearing: {e}")
            
    insert_data = {"case_id": case_id, **hearing_data}
    result = supabase.table("hearings").insert(insert_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add hearing.")
    
    if "next_date" in hearing_data and hearing_data["next_date"]:
        supabase.table("cases").update({"next_hearing_date": hearing_data["next_date"]}).eq("id", case_id).execute()
    
    from app.services.case_analyzer import CaseAnalyzer
    await CaseAnalyzer.evaluate_case(case_id)
    
    return result.data[0]


from pydantic import BaseModel
class CopilotRequest(BaseModel):
    query: str

@router.post("/{case_id}/copilot")
@limiter.limit("15/minute")
async def case_copilot(request: Request, case_id: str, body: CopilotRequest, user_id: str = Depends(get_current_user_uuid)):
    """AI Copilot to query case facts and legal knowledge."""
    case_res = supabase.table("cases").select("*").eq("id", case_id).eq("user_id", user_id).single().execute()
    if not case_res.data:
        raise HTTPException(status_code=404, detail="Case not found.")
    case = case_res.data
    
    hearings_res = supabase.table("hearings").select("*").eq("case_id", case_id).order("hearing_date", desc=True).execute()
    hearings = hearings_res.data or []
    
    hearings_context = ""
    for h in hearings:
        next_date_str = f", Next Date: {h.get('next_date')}" if h.get('next_date') else ""
        hearings_context += (
            f"- Hearing Date: {h.get('hearing_date')}{next_date_str}\n"
            f"  Outcome/Summary: {h.get('court_order_summary') or 'N/A'}\n"
            f"  Notes: {h.get('notes') or 'N/A'}\n"
        )

    from app.services.embedding import EmbeddingService
    try:
        query_embedding = await EmbeddingService.embed_text(body.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding service failed: {e}")
        
    doc_results = supabase.rpc("vector_search", {
        "query_embedding": query_embedding,
        "match_count": 4,
        "p_user_id": user_id,
        "p_case_id": case_id
    }).execute().data or []
    
    legal_results = supabase.rpc("hybrid_search_knowledge", {
        "query_embedding": query_embedding,
        "query_text": body.query,
        "match_count": 4
    }).execute().data or []
    
    strength_score = case.get("case_strength_score")
    strength_pct = f"{int(float(strength_score) * 100)}%" if strength_score is not None else "0%"
    
    context = ""
    for r in doc_results:
        context += f"[Case Document Chunk]: {r.get('chunk_text', '')}\n"
    for r in legal_results:
        context += f"[Legal Knowledge {r.get('source_name', '')} {r.get('section', '')}]: {r.get('content', '')}\n"
        
    prompt = (
        f"You are the AI Legal Copilot assisting with case: '{case['case_title']}' ({case['case_type']}).\n"
        f"Court: {case.get('court_name') or 'N/A'}\n"
        f"Current Case Favourability Score: {strength_pct}\n"
        f"Initial Facts/Notes: {case.get('ai_context_summary') or 'N/A'}\n"
        f"Summary: {case.get('ai_context_summary') or 'N/A'}\n\n"
        f"Hearing History:\n{hearings_context or 'No hearings recorded.'}\n\n"
        f"Context:\n{context}\n\n"
        f"User Query: {body.query}\n"
        f"Help the user by answering the query using the context."
    )
    
    from app.ai.router import ai_router
    system_prompt = (
        "You are the AI Legal Copilot assisting with this case. Help the user by answering the query using the provided context.\n"
        "CRITICAL: Respond exactly in the language of the user's query (English, Hindi, or Hinglish). Do NOT translate or mix multiple languages in a single response unless specifically requested.\n"
        "- If the user asks to justify or explain the Favourability Score (e.g., 'Justify the Favourability Score' or 'Assess overall case strength'), provide a detailed, clear breakdown of why this score was assigned. Highlight: 1. Positive aspects/strengths in the case (e.g., settlements, strong evidence, documents). 2. Potential problems/weaknesses or missing files. 3. Suggestions to improve the score.\n"
        "Keep your response concise, clear, and professional. Avoid long introductions, disclaimers, or generic explainers unless requested."
    )
    reply = await ai_router.generate_response(prompt=prompt, system_prompt=system_prompt)
    
    sources = []
    for r in doc_results:
        sources.append({"source": "Case Document", "section": r.get("section", "")})
    for r in legal_results:
        sources.append({"source": r.get("source_name", "Legal Knowledge"), "section": r.get("section", "")})

    return {
        "reply": reply,
        "sources": sources
    }

@router.post("/{case_id}/evaluate")
async def trigger_case_evaluation(case_id: str, user_id: str = Depends(get_current_user_uuid)):
    """Manually trigger AI case strength and summary re-evaluation."""
    case = supabase.table("cases").select("id").eq("id", case_id).eq("user_id", user_id).single().execute()
    if not case.data:
        raise HTTPException(status_code=404, detail="Case not found.")
        
    from app.services.case_analyzer import CaseAnalyzer
    res = await CaseAnalyzer.evaluate_case(case_id)
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

