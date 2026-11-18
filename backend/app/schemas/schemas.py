from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth & User ---
class UserCreate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    password: Optional[str] = "Demo@12345"
    preferred_language: Optional[str] = "en"

class UserLogin(BaseModel):
    email_or_phone: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: Optional[str] = None
    role: Optional[str] = "CITIZEN"

class UserOut(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    preferred_language: str
    is_active: bool
    
    class Config:
        from_attributes = True

# --- Citizen Profile ---
class CitizenProfileBase(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    residence_type: Optional[str] = None  # Rural, Urban
    occupation: Optional[str] = None  # Farmer, Student, Homemaker, etc.
    annual_family_income: Optional[float] = None
    income_range: Optional[str] = None
    social_category: Optional[str] = None
    disability_status: Optional[str] = None
    education_level: Optional[str] = None
    marital_status: Optional[str] = None
    land_holding_acres: Optional[float] = None
    has_bpl_ration_card: Optional[bool] = None

class CitizenProfileUpdate(CitizenProfileBase):
    pass

class CitizenProfileOut(CitizenProfileBase):
    id: int
    user_id: int
    updated_at: Optional[datetime] = None
    completion_percentage: Optional[int] = 0

    class Config:
        from_attributes = True

# --- State & District ---
class DistrictOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class StateOut(BaseModel):
    id: int
    name: str
    code: str
    is_union_territory: bool
    districts: List[DistrictOut] = []

    class Config:
        from_attributes = True

# --- Schemes ---
class SchemeDocumentOut(BaseModel):
    id: int
    document_name: str
    description: Optional[str] = None
    is_mandatory: bool
    issuing_authority: Optional[str] = None

    class Config:
        from_attributes = True

class SchemeSourceOut(BaseModel):
    id: int
    title: str
    url: str
    source_type: str
    last_verified: str

    class Config:
        from_attributes = True

class EligibilityRuleOut(BaseModel):
    id: int
    field: str
    operator: str
    value: str
    description: str
    is_mandatory: bool

    class Config:
        from_attributes = True

class SchemeTranslationOut(BaseModel):
    language: str
    name: str
    short_description: str
    benefits: str

    class Config:
        from_attributes = True

class SchemeOut(BaseModel):
    id: int
    code: str
    name: str
    authority: str
    level: str
    applicable_state: Optional[str] = None
    category: str
    target_beneficiaries: str
    short_description: str
    benefits: str
    financial_benefit_amount: Optional[float] = None
    official_apply_url: Optional[str] = None
    official_source_url: Optional[str] = None
    last_verified_date: str
    is_demo_data: bool
    
    # Translated view if language requested
    translated_name: Optional[str] = None
    translated_short_description: Optional[str] = None
    translated_benefits: Optional[str] = None
    
    # Eligibility badge if calculated
    eligibility_status: Optional[str] = None  # PASSED, FAILED, UNKNOWN, NOT_EVALUATED

    class Config:
        from_attributes = True

class SchemeDetailOut(SchemeOut):
    full_description: str
    application_procedure: Optional[str] = None
    important_conditions: Optional[str] = None
    rules: List[EligibilityRuleOut] = []
    documents: List[SchemeDocumentOut] = []
    sources: List[SchemeSourceOut] = []

    class Config:
        from_attributes = True

# --- Deterministic Eligibility Evaluation ---
class CriterionResult(BaseModel):
    field: str
    description: str
    status: str  # PASSED, FAILED, UNKNOWN
    user_value: Optional[Any] = None
    required_value: str
    explanation: str

class EligibilityEvaluationOut(BaseModel):
    scheme_id: int
    scheme_name: str
    overall_status: str  # PASSED, FAILED, UNKNOWN
    passed_criteria: List[CriterionResult] = []
    failed_criteria: List[CriterionResult] = []
    unknown_criteria: List[CriterionResult] = []
    missing_fields: List[str] = []
    summary_explanation: str
    next_steps: str
    disclaimer: str = "Informational evaluation only. Official determination is made solely by the respective government authority."

# --- Chatbot & RAG ---
class ChatMessageCreate(BaseModel):
    message: str
    session_uuid: Optional[str] = None
    language: Optional[str] = "en"
    profile_updates: Optional[CitizenProfileUpdate] = None

class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    language: str
    recommended_schemes: Optional[List[Dict[str, Any]]] = None
    eligibility_breakdowns: Optional[List[Dict[str, Any]]] = None
    missing_fields: Optional[List[str]] = None
    suggested_questions: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionOut(BaseModel):
    id: int
    session_uuid: str
    title: str
    language: str
    messages: List[ChatMessageOut] = []

    class Config:
        from_attributes = True

# --- Voice ---
class VoiceTranscribeRequest(BaseModel):
    audio_base64: Optional[str] = None
    language: str = "en"
    mock_text: Optional[str] = None

class VoiceTranscribeResponse(BaseModel):
    recognized_text: str
    language: str
    provider: str

class VoiceSynthesizeRequest(BaseModel):
    text: str
    language: str = "en"

class VoiceSynthesizeResponse(BaseModel):
    text: str
    language: str
    audio_url: Optional[str] = None
    status: str

# --- Action Plan ---
class ActionPlanStepOut(BaseModel):
    id: int
    step_number: int
    title: str
    description: str
    is_completed: bool
    action_url: Optional[str] = None
    action_label: Optional[str] = None

    class Config:
        from_attributes = True

class ActionPlanOut(BaseModel):
    id: int
    scheme_id: int
    scheme_name: str
    status: str
    progress_percentage: int
    steps: List[ActionPlanStepOut] = []

    class Config:
        from_attributes = True

# --- User Documents ---
class UserDocumentOut(BaseModel):
    id: int
    document_name: str
    status: str  # READY, IN_PROGRESS, NOT_READY
    is_uploaded: bool
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# --- Admin ---
class AdminSchemeCreate(BaseModel):
    code: str
    name: str
    authority: str
    level: str = "Central"
    applicable_state: Optional[str] = "All"
    category: str
    target_beneficiaries: str
    short_description: str
    full_description: str
    benefits: str
    financial_benefit_amount: Optional[float] = None
    application_procedure: Optional[str] = None
    important_conditions: Optional[str] = None
    official_apply_url: Optional[str] = None
    official_source_url: Optional[str] = None
    is_demo_data: bool = True
    rules: Optional[List[Dict[str, Any]]] = None
    documents: Optional[List[Dict[str, Any]]] = None

class AdminStatsOut(BaseModel):
    total_schemes: int
    central_schemes: int
    state_schemes: int
    total_users: int
    total_evaluations: int
    supported_languages_count: int
    categories_count: int
