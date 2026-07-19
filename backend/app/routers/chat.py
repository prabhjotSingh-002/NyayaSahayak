# AI Vakil Chat API Router
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from app.dependencies import get_current_user_uuid
from app.models.database import supabase
from app.ai.router import ai_router
from app.services.embedding import EmbeddingService
from app.rate_limiter import limiter

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    context_type: str = "general"
    case_id: Optional[str] = None
    document_id: Optional[str] = None
    save_transcript: bool = False
    mode: Optional[str] = "aam_aadmi"


class ConversationCreate(BaseModel):
    title: str
    context_type: str = "general"
    case_id: Optional[str] = None
    document_id: Optional[str] = None


@router.post("/conversations")
async def create_conversation(body: ConversationCreate, user_id: str = Depends(get_current_user_uuid)):
    """Create a new conversation thread."""
    data = {
        "user_id": user_id,
        "title": body.title,
        "context_type": body.context_type,
        "case_id": body.case_id,
        "document_id": body.document_id,
    }
    result = supabase.table("conversations").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create conversation.")
    return result.data[0]


@router.get("/conversations")
async def list_conversations(user_id: str = Depends(get_current_user_uuid)):
    """Get all conversations for current user."""
    result = supabase.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
    return result.data or []


@router.get("/conversations/{conv_id}/messages")
async def get_messages(conv_id: str, user_id: str = Depends(get_current_user_uuid)):
    """Get all messages in a conversation."""
    conv = supabase.table("conversations").select("id").eq("id", conv_id).eq("user_id", user_id).single().execute()
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    result = supabase.table("messages").select("*").eq("conversation_id", conv_id).order("created_at").execute()
    return result.data or []


@router.post("/send")
@limiter.limit("15/minute")
async def send_message(request: Request, body: ChatRequest, user_id: str = Depends(get_current_user_uuid)):
    """Core chat endpoint that queries AI with retrieved RAG context."""
    conv_id = body.conversation_id
    if not conv_id:
        title = body.message[:60] + ("..." if len(body.message) > 60 else "")
        conv_result = supabase.table("conversations").insert({
            "user_id": user_id,
            "title": title,
            "context_type": body.context_type,
            "case_id": body.case_id,
            "document_id": body.document_id,
        }).execute()
        conv_id = conv_result.data[0]["id"]
    
    # Retrieve last 10 messages for conversational history context
    history_result = supabase.table("messages").select("role, content").eq("conversation_id", conv_id).order("created_at", desc=True).limit(10).execute()
    history = list(reversed(history_result.data or []))

    # Retrieve relevant semantic context
    sources = []
    rag_context = ""
    try:
        query_embedding = await EmbeddingService.embed_text(body.message)
        
        legal_results = supabase.rpc("hybrid_search_knowledge", {
            "query_embedding": query_embedding,
            "query_text": body.message,
            "match_count": 4
        }).execute()
        
        user_doc_results = []
        if body.case_id or body.document_id:
            user_doc_results = supabase.rpc("vector_search", {
                "query_embedding": query_embedding,
                "match_count": 3,
                "p_user_id": user_id,
                "p_case_id": body.case_id,
                "p_doc_id": body.document_id,
            }).execute().data or []

        all_chunks = (legal_results.data or []) + user_doc_results
        
        if all_chunks:
            rag_context = "\n\n---\nRELEVANT LEGAL CONTEXT:\n"
            for chunk in all_chunks[:6]:
                source_label = chunk.get("source_name", chunk.get("document_id", "Unknown"))
                section_label = chunk.get("section", "")
                rag_context += f"\n[{source_label} {section_label}]:\n{chunk['content']}\n"
                sources.append({"source": source_label, "section": section_label})
    except Exception as e:
        print(f"RAG search failed (non-critical): {e}")

    # Build context-aware prompt
    case_context = ""
    case_empty = False
    case_info_instruction = ""
    if body.case_id:
        try:
            case = supabase.table("cases").select("case_title, case_type, court_name, ai_context_summary").eq("id", body.case_id).single().execute()
            if case.data:
                c = case.data
                case_context = f"\n\nCURRENT CASE CONTEXT:\nTitle: {c['case_title']}\nType: {c['case_type']}\nCourt: {c.get('court_name', 'N/A')}\nAI Summary: {c.get('ai_context_summary', 'N/A')}"
            
            doc_count_res = supabase.table("documents").select("id", count="exact").eq("case_id", body.case_id).execute()
            doc_count = doc_count_res.count if doc_count_res.count is not None else len(doc_count_res.data or [])
            
            hearing_count_res = supabase.table("hearings").select("id", count="exact").eq("case_id", body.case_id).execute()
            hearing_count = hearing_count_res.count if hearing_count_res.count is not None else len(hearing_count_res.data or [])
            
            if doc_count == 0 and hearing_count == 0:
                case_empty = True
                case_info_instruction = (
                    "\n[SYSTEM NOTICE: This case currently has 0 uploaded documents and 0 scheduled hearings. "
                    "If the user asks about case-specific details, summaries, or what happened in hearings, politely "
                    "inform them in the user's query language (English, Hindi, or Hinglish) that no case files or hearings have been uploaded/added yet. "
                    "Instruct them to upload PDFs/images via the 'Documents' tab or add a hearing schedule. "
                    "If the user asks general legal queries, answer professionally in their language using the provided legal context.]"
                )
        except Exception as e:
            print(f"Error resolving case context and stats: {e}")

    # Fetch last 6 items for context length optimization
    history_str = ""
    for msg in history[-6:]:
        role_label = "User" if msg["role"] == "user" else "NyayaSahayak"
        history_str += f"{role_label}: {msg['content']}\n"

    system_prompt = """You are NyayaSahayak, an expert AI Legal Companion and RAG-powered assistant specializing in the Indian legal system.

ACT AS A COMPASSIONATE DIGITAL LEGAL COMPANION:
- Use simple, everyday words and clear analogies (e.g. 'Imagine you are vacating a rented flat...').
- Adapt your language to exactly match the user's query language (e.g. use clean English for English queries, and clean Hindi/Hinglish for Hindi/Hinglish queries) to keep the tone accessible and reassuring.
- Highlight legal concepts using exact, precise Section numbers and Act citations so they can be parsed as token chips.
- **CRITICAL:** Prioritize citing the NEW Indian laws (BNS 2023, BNSS 2023, BSA 2023) over the old codes (IPC, CrPC, IEA) so the user knows RAG is citing active modern laws.

CRITICAL RESPONSE FORMAT RULES — ALWAYS ORGANIZE RESPONSES INTO THESE EXACT HEADING SECTIONS WITHOUT EXCEPTION:

1. `### 🎯 Seedha Jawab`
   - Sabse upar, 2 lines max. Give a direct, bold summary answer to the user's core problem immediately in simple everyday Hindi/English (e.g., "Aapke bike ki chabi police bin-warrant nahi le sakti.").

2. `### 🚨 Illegal Action Alert` (Optional — use only if the situation involves illegal acts, police harassment, or critical legal liabilities)
   - Highlight the specific illegal behavior (e.g., "Officer ke paas chabi nikaalne ka legal right nahi hai").

3. `### 📜 Kanoon Kehta Hai`
   - List the applicable legal sections as bullet points.
   - Format: `[Act Name · Section X]` — brief description of section.
   - Example: `[Motor Vehicles Act 2019 · Section 139]` — Digital license is legally valid.
   - Every legal citation must be written exactly as `Section X, Act Name Year` or `[Act Name · Section X]` to trigger the custom frontend Section chip renderer.

4. `### 💡 Aapke Liye Iska Matlab`
   - Provide 2-3 practical, immediate action steps (e.g. "Phone nikalo — Officer ka naam record karo").

5. `### 🔗 Agle Actions` (Cross-feature triggers)
   - Add exactly 2-3 action links using standard markdown links formatted exactly as buttons:
     - `-[📝 Draft Notice / Legal Complaint](/docdraft)`
     - `-[📂 Save to Case Vault](/casevault)`

6. `### 🛡️ Disclaimer`
   - A standalone warning box at the end. Warn the user that AI responses are informational and not a substitute for physical legal counsel.

7. `### ❓ Suggested Questions`
   - Provide exactly 3 contextually relevant, click-to-ask follow-up questions that the user might want to ask next. Format them as a simple bulleted list of plain text questions.
   - Example:
     - What are my rights if the officer threatens to seize the vehicle?
     - Under which section can I file a complaint against the officer?
     - Does this apply to all states in India?

CRITICAL: Respond exactly in the language of the user's query (English, Hindi, or Hinglish). Do NOT translate or mix multiple languages in a single response unless specifically requested.
Keep your response concise, clear, and professional. Avoid conversational intros like "Namaste" or "Certainly! I can help you with that" shuruat mein."""

    full_prompt = f"""{history_str}
User: {body.message}
{case_context}
{case_info_instruction}
{rag_context}

NyayaSahayak:"""

    try:
        reply = await ai_router.generate_response(prompt=full_prompt, system_prompt=system_prompt)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

    # Persist message history
    supabase.table("messages").insert([
        {"conversation_id": conv_id, "role": "user", "content": body.message},
        {"conversation_id": conv_id, "role": "assistant", "content": reply, "metadata": {"sources": sources}}
    ]).execute()
    
    supabase.table("conversations").update({"updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", conv_id).execute()

    return {
        "conversation_id": conv_id,
        "reply": reply,
        "sources": sources,
    }


@router.post("/conversations/{conv_id}/summarize")
async def summarize_conversation(conv_id: str, user_id: str = Depends(get_current_user_uuid)):
    """Generate a summary document from a conversation transcript."""
    conv = supabase.table("conversations").select("*").eq("id", conv_id).eq("user_id", user_id).single().execute()
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    
    messages = supabase.table("messages").select("role, content").eq("conversation_id", conv_id).order("created_at").execute()
    
    transcript = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in (messages.data or [])])
    
    summary_prompt = f"""Summarize this legal consultation conversation into a structured document with:
1. Key Legal Issues Discussed
2. Laws/Sections Cited
3. AI Recommendations
4. Action Items for the User

Conversation Transcript:
{transcript[:8000]}"""

    summary = await ai_router.generate_response(
        prompt=summary_prompt,
        system_prompt="You are a legal secretary creating a professional consultation summary document."
    )
    
    return {
        "conversation_id": conv_id,
        "title": conv.data["title"],
        "summary": summary,
        "message_count": len(messages.data or [])
    }
