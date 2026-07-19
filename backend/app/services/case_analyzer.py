import json
from app.models.database import supabase
from app.ai.router import ai_router

class CaseAnalyzer:
    @staticmethod
    async def evaluate_case(case_id: str) -> dict:
        """Fetches case files, timelines and calls AI to evaluate case summary and strength score."""
        try:
            # Query case details
            case_res = supabase.table("cases").select("*").eq("id", case_id).single().execute()
            if not case_res.data:
                print(f"[CaseAnalyzer] Case {case_id} not found.")
                return {"success": False, "error": "Case not found"}
            
            case = case_res.data
            
            # Query associated document texts
            docs_res = supabase.table("documents").select("filename, doc_type, extracted_text, ai_summary").eq("case_id", case_id).execute()
            docs = docs_res.data or []
            
            # Query associated hearings
            hearings_res = supabase.table("hearings").select("hearing_date, court_order_summary, notes").eq("case_id", case_id).order("hearing_date").execute()
            hearings = hearings_res.data or []
            
            # Extract raw user notes from existing summary if structured
            raw_summary = case.get("ai_context_summary") or ""
            user_notes = ""
            if "--- USER DESCRIPTION ---" in raw_summary:
                parts = raw_summary.split("--- USER DESCRIPTION ---")
                content = parts[1] if len(parts) > 1 else ""
                if "--- AI SUMMARY ---" in content:
                    subparts = content.split("--- AI SUMMARY ---")
                    user_notes = subparts[0].strip()
                else:
                    user_notes = content.strip()
            else:
                user_notes = raw_summary

            has_initial_notes = len(user_notes.strip()) > 0

            if not docs and not hearings and not has_initial_notes:
                supabase.table("cases").update({
                    "ai_context_summary": "No documents uploaded yet to generate context summary.",
                    "case_strength_score": 0.0
                }).eq("id", case_id).execute()
                return {"success": True, "message": "Cleared case metrics (no docs/hearings)"}
            
            # Build documents context strings
            docs_context = ""
            for idx, d in enumerate(docs):
                doc_content = d.get("ai_summary") or d.get("extracted_text") or ""
                text_snippet = doc_content[:3000]
                docs_context += f"\n--- Document {idx+1}: {d.get('filename')} (Type: {d.get('doc_type')}) ---\n"
                docs_context += text_snippet + "\n"
                
            hearings_context = ""
            for idx, h in enumerate(hearings):
                hearings_context += f"\n--- Hearing {idx+1} ({h.get('hearing_date')}) ---\n"
                hearings_context += f"Order Summary: {h.get('court_order_summary') or 'N/A'}\n"
                hearings_context += f"Notes: {h.get('notes') or 'N/A'}\n"
            
            system_prompt = """You are a senior Indian Legal Analyst and Case Evaluator.
Generate a master CASE SUMMARY and a precise AI CASE FAVOURABILITY SCORE (case strength) based on the case details, uploaded documents, and hearing history.

The score (from 0.00 to 1.00) represents how favorable the case outcome is for the client:
- 0.00 means a lost cause or worst-case outcome.
- 1.00 means an airtight case or completely successful resolution.
- IMPORTANT: Analyze the timeline updates and hearings carefully. If a recent hearing or update states that the parties have reached a mutual agreement, out-of-court settlement, or a successful compromise (e.g., 'sab raazi ho gaye', 'negotiations successful', 'reached an agreement', 'matter resolved', 'mutual settlement'), this is a major positive outcome. The score should reflect this success and be set very high (0.90 to 1.00).
- If key evidence is missing or procedural risks are high, adjust the score lower.

CRITICAL: The case_summary must ALWAYS be written in English, regardless of the input language of the documents, notes, or hearings.

CRITICAL: Respond ONLY with a valid JSON object in this exact format:
{
    "case_summary": "A synthesized summary of the case facts, evidence, legal issues, and procedural status. Be professional, direct, and educational.",
    "strength_score": 0.95
}"""
 
            prompt = f"""Case Details:
Title: {case.get('case_title')}
Type: {case.get('case_type')}
Court: {case.get('court_name') or 'TBD'}
Petitioner: {case.get('petitioner') or 'N/A'}
Respondent: {case.get('respondent') or 'N/A'}
Initial Notes: {user_notes or 'N/A'}
 
Case Documents Context:
{docs_context or "No documents uploaded."}
 
Hearing History Context:
{hearings_context or "No hearings recorded."}
 
Generate the JSON evaluation."""
 
            response_text = await ai_router.generate_response(prompt=prompt, system_prompt=system_prompt)
            
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].strip()
                
            result_json = json.loads(response_text)
            summary = result_json.get("case_summary", "")
            score = float(result_json.get("strength_score", 0.5))
            
            # Clamp the score safely between 0.0 and 1.0
            score = max(0.0, min(1.0, score))
            
            # Update DB with custom composite summary schema
            db_summary = f"--- USER DESCRIPTION ---\n{user_notes}\n--- AI SUMMARY ---\n{summary}"
            supabase.table("cases").update({
                "ai_context_summary": db_summary,
                "case_strength_score": score
            }).eq("id", case_id).execute()
            
            print(f"[CaseAnalyzer] Evaluated case {case_id}: strength={score:.2f}")
            return {"success": True, "summary": summary, "strength": score}
            
        except Exception as e:
            print(f"[CaseAnalyzer] Error evaluating case {case_id}: {e}")
            return {"success": False, "error": str(e)}
