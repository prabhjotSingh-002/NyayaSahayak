# Document Drafting API Router
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.dependencies import get_current_user_uuid
from app.ai.router import ai_router
from app.rate_limiter import limiter
import json

router = APIRouter(prefix="/drafting", tags=["drafting"])

# Predefined templates database metadata
TEMPLATES = {
    "affidavit": {
        "name": "Affidavit",
        "description": "A sworn statement of facts used in court proceedings.",
        "fields": [
            {"key": "deponent_name",  "label": "Deponent's Full Name",  "type": "text",     "required": True},
            {"key": "deponent_age",   "label": "Age",                   "type": "number",   "required": True},
            {"key": "deponent_address","label": "Full Address",          "type": "textarea", "required": True},
            {"key": "statement",      "label": "Statement of Facts",    "type": "textarea", "required": True},
            {"key": "place",          "label": "Place of Swearing",     "type": "text",     "required": True},
            {"key": "date",           "label": "Date",                  "type": "date",     "required": True},
        ]
    },
    "nda": {
        "name": "Non-Disclosure Agreement",
        "description": "Protects confidential information shared between parties.",
        "fields": [
            {"key": "party_a_name",   "label": "Disclosing Party Name",  "type": "text",     "required": True},
            {"key": "party_a_address","label": "Disclosing Party Address","type": "textarea", "required": True},
            {"key": "party_b_name",   "label": "Receiving Party Name",   "type": "text",     "required": True},
            {"key": "party_b_address","label": "Receiving Party Address", "type": "textarea", "required": True},
            {"key": "purpose",        "label": "Purpose of Disclosure",  "type": "textarea", "required": True},
            {"key": "duration_years", "label": "Confidentiality Period (years)", "type": "number", "required": True},
            {"key": "governing_state","label": "Governing State",        "type": "text",     "required": True},
            {"key": "date",           "label": "Agreement Date",         "type": "date",     "required": True},
        ]
    },
    "legal_notice": {
        "name": "Legal Notice",
        "description": "Formal notice before initiating legal proceedings.",
        "fields": [
            {"key": "sender_name",    "label": "Sender's Full Name",     "type": "text",     "required": True},
            {"key": "sender_address", "label": "Sender's Address",       "type": "textarea", "required": True},
            {"key": "recipient_name", "label": "Recipient's Name",       "type": "text",     "required": True},
            {"key": "recipient_address","label":"Recipient's Address",   "type": "textarea", "required": True},
            {"key": "subject",        "label": "Subject of Notice",      "type": "text",     "required": True},
            {"key": "grievance",      "label": "Detailed Grievance",     "type": "textarea", "required": True},
            {"key": "demand",         "label": "Demand / Relief Sought", "type": "textarea", "required": True},
            {"key": "days_to_respond","label": "Days to Respond",        "type": "number",   "required": True},
            {"key": "date",           "label": "Date",                   "type": "date",     "required": True},
        ]
    },
    "rent_agreement": {
        "name": "Rent Agreement",
        "description": "Rental agreement between landlord and tenant.",
        "fields": [
            {"key": "landlord_name",  "label": "Landlord's Full Name",   "type": "text",     "required": True},
            {"key": "tenant_name",    "label": "Tenant's Full Name",     "type": "text",     "required": True},
            {"key": "property_address","label":"Property Address",       "type": "textarea", "required": True},
            {"key": "monthly_rent",   "label": "Monthly Rent (₹)",       "type": "number",   "required": True},
            {"key": "security_deposit","label":"Security Deposit (₹)",   "type": "number",   "required": True},
            {"key": "lease_start",    "label": "Lease Start Date",       "type": "date",     "required": True},
            {"key": "lease_duration_months","label":"Lease Duration (months)","type":"number","required": True},
            {"key": "state",          "label": "State (for stamp duty)", "type": "text",     "required": True},
        ]
    },
    "power_of_attorney": {
        "name": "Power of Attorney",
        "description": "Authorization for a person to act on your behalf.",
        "fields": [
            {"key": "principal_name", "label": "Principal's Full Name",  "type": "text",     "required": True},
            {"key": "principal_address","label":"Principal's Address",   "type": "textarea", "required": True},
            {"key": "agent_name",     "label": "Agent's Full Name",      "type": "text",     "required": True},
            {"key": "agent_address",  "label": "Agent's Address",        "type": "textarea", "required": True},
            {"key": "scope",          "label": "Scope of Authority",     "type": "textarea", "required": True},
            {"key": "date",           "label": "Date",                   "type": "date",     "required": True},
        ]
    },
    "employment_contract": {
        "name": "Employment Contract",
        "description": "Standard employment agreement between employer and employee.",
        "fields": [
            {"key": "company_name",   "label": "Company Name",           "type": "text",     "required": True},
            {"key": "employee_name",  "label": "Employee's Full Name",   "type": "text",     "required": True},
            {"key": "designation",    "label": "Job Title / Designation","type": "text",     "required": True},
            {"key": "start_date",     "label": "Start Date",             "type": "date",     "required": True},
            {"key": "ctc",            "label": "Annual CTC (₹)",         "type": "number",   "required": True},
            {"key": "probation_months","label":"Probation Period (months)","type":"number",  "required": False},
            {"key": "notice_period",  "label": "Notice Period (months)", "type": "number",   "required": True},
            {"key": "work_location",  "label": "Work Location",          "type": "text",     "required": True},
        ]
    },
    "consumer_complaint": {
        "name": "Consumer Complaint",
        "description": "Complaint to the Consumer Disputes Redressal Forum.",
        "fields": [
            {"key": "complainant_name","label":"Complainant's Name",     "type": "text",     "required": True},
            {"key": "complainant_address","label":"Complainant's Address","type":"textarea",  "required": True},
            {"key": "respondent_name","label":"Respondent (Company/Seller)","type":"text",   "required": True},
            {"key": "product_service","label":"Product/Service Bought",  "type": "text",     "required": True},
            {"key": "purchase_date",  "label": "Purchase Date",          "type": "date",     "required": True},
            {"key": "amount",         "label": "Amount Paid (₹)",        "type": "number",   "required": True},
            {"key": "complaint_details","label":"Complaint Details",     "type": "textarea", "required": True},
            {"key": "relief_sought",  "label": "Relief Sought",         "type": "textarea", "required": True},
        ]
    },
    "partnership_deed": {
        "name": "Partnership Deed",
        "description": "Agreement governing a business partnership.",
        "fields": [
            {"key": "firm_name",      "label": "Firm Name",              "type": "text",     "required": True},
            {"key": "partner_1_name", "label": "Partner 1 Name",         "type": "text",     "required": True},
            {"key": "partner_2_name", "label": "Partner 2 Name",         "type": "text",     "required": True},
            {"key": "business_nature","label":"Nature of Business",      "type": "textarea", "required": True},
            {"key": "start_date",     "label": "Start Date",             "type": "date",     "required": True},
            {"key": "capital_partner1","label":"Capital by Partner 1 (₹)","type":"number",   "required": True},
            {"key": "capital_partner2","label":"Capital by Partner 2 (₹)","type":"number",   "required": True},
            {"key": "profit_ratio",   "label": "Profit Sharing Ratio (e.g. 50:50)","type":"text","required": True},
            {"key": "state",          "label": "State",                  "type": "text",     "required": True},
        ]
    },
    "sale_deed": {
        "name": "Property Sale Deed",
        "description": "Transfer property ownership legally with all required clauses.",
        "fields": [
            {"key": "seller_name",      "label": "Seller's Full Name",     "type": "text",     "required": True},
            {"key": "buyer_name",       "label": "Buyer's Full Name",      "type": "text",     "required": True},
            {"key": "property_address",  "label": "Property Address",       "type": "textarea", "required": True},
            {"key": "sale_amount",      "label": "Sale Amount (₹)",        "type": "number",   "required": True},
            {"key": "sale_date",        "label": "Sale Date",              "type": "date",     "required": True},
        ]
    },
    "bail_application": {
        "name": "Bail Application",
        "description": "Regular or anticipatory bail application under BNSS 2023 (formerly CrPC).",
        "fields": [
            {"key": "accused_name",     "label": "Accused Name & Address", "type": "textarea", "required": True},
            {"key": "police_station",   "label": "Police Station Name",    "type": "text",     "required": True},
            {"key": "fir_number",       "label": "FIR Number & Date",      "type": "text",     "required": True},
            {"key": "offence_sections", "label": "Offence Sections (BNS)", "type": "text",     "required": True},
            {"key": "grounds",          "label": "Grounds for Bail",       "type": "textarea", "required": True},
        ]
    },
}

class AnalyzeSituationRequest(BaseModel):
    situation: str
    language: str = "en"


class CustomDraftRequest(BaseModel):
    situation: str
    user_inputs: Optional[Dict[str, Any]] = None
    language: str = "en"
    tone: str = "assertive"

class DraftRequest(BaseModel):
    template_id: str
    fields: Dict[str, Any]
    language: str = "en"
    tone: str = "assertive"
    extra_info: Optional[str] = ""
    include_ai_notes: bool = True

@router.post("/analyze-situation")
@limiter.limit("10/minute")
async def analyze_situation(request: Request, body: AnalyzeSituationRequest, user_id: str = Depends(get_current_user_uuid)):
    """Analyze client's situation to detect required document type and identify missing details."""
    if not body.situation.strip():
        raise HTTPException(status_code=400, detail="Situation cannot be empty.")

    system_prompt = """You are an expert Indian Legal Advisor and Document Drafter.
Analyze the user's situation and determine what specific legal document they need (e.g., Legal Notice, Rent Agreement, Consumer Complaint, NDA, Affidavit, etc.).
Then, identify a list of 4-7 critical or highly helpful personal details or key pieces of information (like party names, addresses, dates of incidents, amounts, specific dates of birth, etc.) that are missing from the situation but are necessary to draft a complete and professional legal document.

Respond ONLY with a valid JSON object in this exact format:
{
  "document_type": "Name of the detected document (e.g. Legal Notice)",
  "explanation": "A very brief explanation of why these details are needed (1-2 sentences).",
  "fields": [
    {
      "key": "uniqueFieldKey",
      "label": "User-friendly label (e.g. Landlord's Full Name)",
      "type": "text",
      "description": "Brief instruction/guidance (e.g. Full name of the landlord renting the premises)",
      "default_value": "A realistic default value based on the situation or generic Indian legal names/dates/values (e.g. Ramesh Kumar, 17/07/2026, Noida, 15000)",
      "required": true
    }
  ]
}
Make sure the field types are either "text", "date", "number", or "textarea".
Do NOT wrap the JSON in markdown code blocks like ```json ... ```. Make sure the JSON parses correctly and is valid. Do not include any other text outside the JSON."""

    prompt = f"Situation:\n{body.situation}\n\nAnalyze and return the missing fields."

    try:
        response_text = await ai_router.generate_response(prompt=prompt, system_prompt=system_prompt)
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].strip()
            
        result_json = json.loads(response_text)
        return {
            "document_type": result_json.get("document_type", "Custom Legal Document"),
            "explanation": result_json.get("explanation", "To make your document legally sound, please fill in the following details."),
            "fields": result_json.get("fields", [])
        }
    except Exception as e:
        print(f"[AnalyzeSituation] Gemini analysis failed, using fallback: {str(e)}")
        return {
            "document_type": "Custom Legal Document",
            "explanation": "Please provide additional details to personalize your document.",
            "fields": [
                {"key": "party_a", "label": "Your Full Name", "type": "text", "description": "Your full name", "default_value": "Ramesh Kumar", "required": False},
                {"key": "party_b", "label": "Opposite Party's Name", "type": "text", "description": "Full name of the opposite party", "default_value": "Suresh Sharma", "required": False},
                {"key": "amount", "label": "Disputed Amount / Consideration", "type": "number", "description": "Amount involved, if any", "default_value": "50000", "required": False},
                {"key": "date", "label": "Relevant Date", "type": "date", "description": "Date of incident or agreement", "default_value": "2026-07-17", "required": False}
            ]
        }

@router.post("/custom")
@limiter.limit("10/minute")
async def generate_custom_document(request: Request, body: CustomDraftRequest, user_id: str = Depends(get_current_user_uuid)):
    """Generate a custom legal document based on user-described situation."""
    if not body.situation.strip():
        raise HTTPException(status_code=400, detail="Situation cannot be empty.")
    
    lang_instruction = {
        "en": "Write the document in formal English.",
        "hi": "दस्तावेज़ को औपचारिक हिंदी में लिखें।",
        "hinglish": "Write the document primarily in English but use Hindi terms for legal concepts."
    }.get(body.language, "Write the document in formal English.")

    tone_instruction = f"The tone of the document should be {body.tone} and legally sound."

    is_revision = "EXISTING DOCUMENT TO REVISE" in body.situation and "USER REVISION REQUEST" in body.situation

    if is_revision:
        system_prompt = f"""You are an expert Indian Legal Document Drafter.
You are revising an existing legal document. Apply ONLY the revision request to the existing document. Keep all other clauses, parties, and details exactly as they are in the existing document.
Do not write a new document from scratch. Preserve the original document's structure, names, dates, addresses, and covenants, modifying only the parts specified in the revision request.
{lang_instruction}
{tone_instruction}
Return the complete revised document with the same structure and all original clauses, updated only where the revision request specifies.

CRITICAL: Do NOT use markdown bolding (**) or asterisks (***). Use plain text and ALL CAPS for emphasis.
CRITICAL: Respond ONLY with a valid JSON object in this exact format:
{{
    "document_text": "The pure legal document text here, without any disclaimers, notes, or instructions.",
    "ai_notes": "Provide 4-6 concise mandatory steps/notes for this document. Each note MUST be on its own line. Format each note EXACTLY as: NUMBER. TITLE: description."
}}"""
        prompt = f"""Apply the revision request below to the existing document:

{body.situation}

Return the complete revised document."""
    else:
        system_prompt = f"""You are an expert Indian Legal Document Drafter.
{lang_instruction}
Generate a complete, legally sound document based on the user's situation following Indian legal standards and formatting.
{tone_instruction}
Include proper formatting, a title, parties involved, and signature blocks.

DRAFTING STYLE AND STRUCTURE:
- Write in a highly formal, professional Indian legal drafting style.
- Include proper structural elements (e.g. title in ALL CAPS, preamble/recitals using standard phrases like 'THIS DEED OF ... IS MADE AND EXECUTED ON...', parentage definitions like 'son of / daughter of / wife of', age and place of residence details for all parties, terms and definitions, covenants, sections/clauses, and 'DEPONENT'/'EXECUTANT'/'SIGNATORY' verification sections where applicable).
- Include witness signature blocks ONLY when drafting Deeds (e.g., Sale Deed, Rent Agreement, Partnership Deed, Gift Deed) or Agreements. Do NOT include witness signature blocks for Legal Notices, Court Applications, Replies, Complaints, or Sworn Statements (unless explicitly requested).
- Ensure definitions like 'LANDLORD', 'TENANT', 'DEPONENT', 'DISCLOSING PARTY', 'RECEIVING PARTY', etc., are formally declared and defined.

CRITICAL INSTRUCTIONS FOR PLACEHOLDERS AND SIGNATURES:
- **NO BRACKET PLACEHOLDERS:** Do NOT output any empty bracket text placeholders like `[NAME]`, `[DATE]`, `[ADDRESS]`, or `[CITY]`. If a details is missing from the situation, use realistic, standard Indian defaults (e.g. today's date, realistic party names/cities) or a clean blank line for physical writing (e.g. `_________________`).
- **NO SIGNATURE BRACKETS:** Do NOT output bracket placeholders for signatures like `[SIGNATURE OF SENDER]` or `[ADVOCATE SIGNATURE]`. Instead, use clean lines like `Signature of Landlord: _________________` or simple instructions like `(Signature of Recipient)`.
- **EMBED SECTIONS:** Explicitly mention the relevant sections of Indian law (such as BNS 2023, BNSS 2023, BSA 2023, Indian Contract Act 1872) directly inside the clauses of the document text so the document is self-contained and authoritative.

CRITICAL: Do NOT use markdown bolding (**) or asterisks (***). Use plain text and ALL CAPS for emphasis.
CRITICAL: Respond ONLY with a valid JSON object in this exact format:
{{
    "document_text": "The pure legal document text here, without any disclaimers, notes, or instructions.",
    "ai_notes": "Provide 4-6 concise mandatory steps/notes for this document. Each note MUST be on its own line. Format each note EXACTLY as: NUMBER. TITLE: description. Example: 1. MANDATORY REGISTRATION: This deed must be registered at the Sub-Registrar Office.\\n2. STAMP DUTY: Ensure appropriate stamp duty is paid."
}}"""
        user_details_text = ""
        if body.user_inputs:
            user_details_text = "\n".join([f"- {k}: {v}" for k, v in body.user_inputs.items() if v])

        prompt = f"Situation:\n{body.situation}\n\n"
        if user_details_text:
            prompt += f"Specific Details Provided by User:\n{user_details_text}\n\n"
        prompt += "Generate the complete legal document."

    try:
        response_text = await ai_router.generate_response(prompt=prompt, system_prompt=system_prompt)
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].strip()
            
        result_json = json.loads(response_text)
        document_text = result_json.get("document_text", "")
        ai_notes = result_json.get("ai_notes", "")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable or parsing failed: {str(e)}")
    
    # Save generated draft to documents table
    try:
        import uuid
        from app.models.database import supabase
        doc_id = str(uuid.uuid4())
        doc_data = {
            "id": doc_id,
            "user_id": user_id,
            "filename": "Custom_Legal_Document.pdf",
            "storage_path": f"drafts/{user_id}/{doc_id}/Custom_Legal_Document.pdf",
            "mime_type": "application/pdf",
            "file_size_bytes": len(document_text.encode('utf-8')),
            "page_count": 1,
            "doc_type": "draft",
            "extracted_text": document_text,
            "analysis_status": "completed",
            "ai_summary": f"Custom drafted document. Tone: {body.tone}."
        }
        supabase.table("documents").insert(doc_data).execute()
    except Exception as save_err:
        print(f"[drafting] Failed to save generated custom document: {save_err}")

    return {
        "template_id": "custom",
        "template_name": "Custom Legal Document",
        "document_text": document_text,
        "ai_notes": ai_notes,
        "language": body.language,
        "tone": body.tone
    }

@router.get("/templates")
async def list_templates():
    """Return all available document templates."""
    return [
        {"id": tid, "name": tdata["name"], "description": tdata["description"], "field_count": len(tdata["fields"])}
        for tid, tdata in TEMPLATES.items()
    ]

@router.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Return field definitions for a specific template."""
    if template_id not in TEMPLATES:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found.")
    return TEMPLATES[template_id]

@router.post("/generate")
@limiter.limit("10/minute")
async def generate_document(request: Request, body: DraftRequest, user_id: str = Depends(get_current_user_uuid)):
    """Use AI to generate a fully formatted legal document from a template and user fields."""
    if body.template_id not in TEMPLATES:
        raise HTTPException(status_code=404, detail=f"Template '{body.template_id}' not found.")
    
    template = TEMPLATES[body.template_id]
    fields_text = "\n".join([f"- {k}: {v}" for k, v in body.fields.items()])
    
    lang_instruction = {
        "en": "Write the document in formal English.",
        "hi": "दस्तावेज़ को औपचारिक हिंदी में लिखें।",
        "hinglish": "Write the document primarily in English but use Hindi terms for legal concepts."
    }.get(body.language, "Write the document in formal English.")
    
    tone_instruction = f"The tone of the document should be {body.tone} and legally sound."

    is_revision = body.extra_info and "EXISTING DOCUMENT TO REVISE" in body.extra_info and "USER REVISION REQUEST" in body.extra_info
    
    if is_revision:
        system_prompt = f"""You are an expert Indian Legal Document Drafter.
You are revising an existing legal document. Apply ONLY the revision request to the existing document. Keep all other clauses, parties, and details exactly as they are in the existing document.
Do not write a new document from scratch. Preserve the original document's structure, names, dates, addresses, and covenants, modifying only the parts specified in the revision request.
{lang_instruction}
{tone_instruction}
Return the complete revised document with the same structure and all original clauses, updated only where the revision request specifies.

CRITICAL: Do NOT use markdown bolding (**) or asterisks (***). Use plain text and ALL CAPS for emphasis.
CRITICAL: Respond ONLY with a valid JSON object in this exact format:
{{
    "document_text": "The pure legal document text here, without any disclaimers, notes, or instructions.",
    "ai_notes": "Include applicable law sections, key considerations, and physical signing instructions for the deponent/parties here."
}}"""
        prompt = f"""You are revising an existing legal document. Apply ONLY the revision request below to the existing document. Keep all other clauses, parties, and details exactly as they are in the existing document.

{body.extra_info}

Return the complete revised document with the same structure and all original clauses, updated only where the revision request specifies."""
    else:
        system_prompt = f"""You are an expert Indian Legal Document Drafter.
{lang_instruction}
Generate a complete, legally sound {template['name']} document following Indian legal standards and formatting.
{tone_instruction}
Include all standard clauses, proper formatting, and signature blocks.

DRAFTING STYLE AND STRUCTURE:
- Write in a highly formal, professional Indian legal drafting style.
- Include proper structural elements (e.g. title in ALL CAPS, preamble/recitals using standard phrases like 'THIS DEED OF ... IS MADE AND EXECUTED ON...', parentage definitions like 'son of / daughter of / wife of', age and place of residence details for all parties, terms and definitions, covenants, sections/clauses, and 'DEPONENT'/'EXECUTANT'/'SIGNATORY' verification sections where applicable).
- Include witness signature blocks ONLY when drafting Deeds (e.g., Sale Deed, Rent Agreement, Partnership Deed, Gift Deed) or Agreements. Do NOT include witness signature blocks for Legal Notices, Court Applications, Replies, Complaints, or Sworn Statements (unless explicitly requested).
- Ensure definitions like 'LANDLORD', 'TENANT', 'DEPONENT', 'DISCLOSING PARTY', 'RECEIVING PARTY', etc., are formally declared and defined.

CRITICAL INSTRUCTIONS FOR PLACEHOLDERS AND SIGNATURES:
- **NO BRACKET PLACEHOLDERS:** Do NOT output any empty bracket text placeholders like `[NAME]`, `[DATE]`, `[ADDRESS]`, or `[CITY]`. If a details is missing from the situation, use realistic, standard Indian defaults (e.g. today's date, realistic party names/cities) or a clean blank line for physical writing (e.g. `_________________`).
- **NO SIGNATURE BRACKETS:** Do NOT output bracket placeholders for signatures like `[SIGNATURE OF SENDER]` or `[ADVOCATE SIGNATURE]`. Instead, use clean lines like `Signature of Landlord: _________________` or simple instructions like `(Signature of Recipient)`.
- **EMBED SECTIONS:** Explicitly mention the relevant sections of Indian law (such as BNS 2023, BNSS 2023, BSA 2023, Indian Contract Act 1872) directly inside the clauses of the document text so the document is self-contained and authoritative.

CRITICAL: Do NOT use markdown bolding (**) or asterisks (***). Use plain text and ALL CAPS for emphasis.
CRITICAL: Respond ONLY with a valid JSON object in this exact format:
{{
    "document_text": "The pure legal document text here, without any disclaimers, notes, or instructions.",
    "ai_notes": "Include applicable law sections, key considerations, and physical signing instructions for the deponent/parties here."
}}"""
        prompt = f"""Generate a complete {template['name']} document with these details:

{fields_text}
"""
        if body.extra_info:
            prompt += f"\nAdditional Context / Custom Instructions:\n{body.extra_info}\n"
        
        prompt += f"""
Format as a proper legal document with:
- Title/Header
- Parties section  
- All necessary clauses
- Signature blocks
- Witness section where applicable

{"Also provide a brief 'Legal Notes' section highlighting any important considerations for the user." if body.include_ai_notes else ""}"""
    
    try:
        response_text = await ai_router.generate_response(prompt=prompt, system_prompt=system_prompt)
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].strip()
            
        result_json = json.loads(response_text)
        document_text = result_json.get("document_text", "")
        ai_notes = result_json.get("ai_notes", "")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable or parsing failed: {str(e)}")
    
    # Save generated draft to documents table
    try:
        import uuid
        from app.models.database import supabase
        doc_id = str(uuid.uuid4())
        clean_filename = f"{template['name'].replace(' ', '_')}.pdf"
        doc_data = {
            "id": doc_id,
            "user_id": user_id,
            "filename": clean_filename,
            "storage_path": f"drafts/{user_id}/{doc_id}/{clean_filename}",
            "mime_type": "application/pdf",
            "file_size_bytes": len(document_text.encode('utf-8')),
            "page_count": 1,
            "doc_type": "draft",
            "extracted_text": document_text,
            "analysis_status": "completed",
            "ai_summary": ai_notes or f"Generated {template['name']} document."
        }
        supabase.table("documents").insert(doc_data).execute()
    except Exception as save_err:
        print(f"[drafting] Failed to save generated template document: {save_err}")

    return {
        "template_id": body.template_id,
        "template_name": template["name"],
        "document_text": document_text,
        "ai_notes": ai_notes,
        "fields_used": body.fields,
        "language": body.language,
        "tone": body.tone
    }
