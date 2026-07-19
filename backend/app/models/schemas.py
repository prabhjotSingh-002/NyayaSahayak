from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Common Models
class UserBase(BaseModel):
    email: str
    name: str
    phone: Optional[str] = None
    preferred_language: str = "en"
    state: Optional[str] = None

class DocumentBase(BaseModel):
    filename: str
    doc_type: str
    case_id: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: str
    storage_path: str
    mime_type: str
    analysis_status: str
    created_at: datetime

# Case Models
class CaseCreate(BaseModel):
    case_title: str
    case_type: str
    court_name: Optional[str] = None
    petitioner: Optional[str] = None
    respondent: Optional[str] = None
    notes: Optional[str] = None

class CaseResponse(CaseCreate):
    id: str
    user_id: str
    current_status: str
    ai_context_summary: Optional[str] = None
    case_strength_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

# Chat Models
class ChatMessage(BaseModel):
    role: str # 'user', 'assistant', 'system'
    content: str

class ChatRequest(BaseModel):
    message: str
    context_type: str = "general" # 'general', 'contract', 'case'
    case_id: Optional[str] = None
    document_id: Optional[str] = None
    model_override: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    sources: List[Dict[str, Any]] = []
