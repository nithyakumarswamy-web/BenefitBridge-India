import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, Enum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=True)
    email = Column(String(150), unique=True, index=True, nullable=True)
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    google_id = Column(String(100), unique=True, index=True, nullable=True)
    profile_picture = Column(String(500), nullable=True)
    auth_provider = Column(String(50), default="local")
    preferred_language = Column(String(10), default="en")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    profile = relationship("CitizenProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    saved_schemes = relationship("SavedScheme", back_populates="user", cascade="all, delete-orphan")
    user_documents = relationship("UserDocument", back_populates="user", cascade="all, delete-orphan")
    action_plans = relationship("ActionPlan", back_populates="user", cascade="all, delete-orphan")
    eligibility_results = relationship("EligibilityResult", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("UserFeedback", back_populates="user", cascade="all, delete-orphan")

class CitizenProfile(Base):
    __tablename__ = "citizen_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)  # Male, Female, Other
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    residence_type = Column(String(20), nullable=True)  # Rural, Urban, Semi-Urban
    occupation = Column(String(100), nullable=True)  # Farmer, Student, Homemaker, Self-Employed, Daily Wage / Laborer, etc.
    annual_family_income = Column(Float, nullable=True)  # Numeric e.g. 150000
    income_range = Column(String(50), nullable=True)  # < 1 Lakh, 1L - 2.5L, 2.5L - 5L, etc.
    social_category = Column(String(50), nullable=True)  # General, OBC, SC, ST, EWS
    disability_status = Column(String(50), nullable=True)  # None, Yes, Locomotor, Visual, Hearing, etc.
    education_level = Column(String(100), nullable=True)  # No formal education, 10th pass, 12th pass, Graduate, etc.
    marital_status = Column(String(30), nullable=True)  # Single, Married, Widowed, Divorced
    land_holding_acres = Column(Float, nullable=True)  # For farmers e.g. 2.5
    has_bpl_ration_card = Column(Boolean, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="profile")

class State(Base):
    __tablename__ = "states"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    is_union_territory = Column(Boolean, default=False)
    
    districts = relationship("District", back_populates="state_rel", cascade="all, delete-orphan")

class District(Base):
    __tablename__ = "districts"
    
    id = Column(Integer, primary_key=True, index=True)
    state_id = Column(Integer, ForeignKey("states.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    
    state_rel = relationship("State", back_populates="districts")

class Scheme(Base):
    __tablename__ = "schemes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    authority = Column(String(200), nullable=False)  # Ministry of Agriculture, Karnataka Govt, etc.
    level = Column(String(20), default="Central")  # Central, State
    applicable_state = Column(String(100), nullable=True)  # All or specific state name e.g. "Karnataka"
    category = Column(String(100), nullable=False, index=True)  # Agriculture, Healthcare, Education, etc.
    target_beneficiaries = Column(String(255), nullable=False)  # Small and marginal farmers, women, etc.
    
    short_description = Column(Text, nullable=False)
    full_description = Column(Text, nullable=False)
    benefits = Column(Text, nullable=False)
    financial_benefit_amount = Column(Float, nullable=True)  # E.g. 6000 or 500000
    
    application_procedure = Column(Text, nullable=True)
    important_conditions = Column(Text, nullable=True)
    
    official_apply_url = Column(String(500), nullable=True)
    official_source_url = Column(String(500), nullable=True)
    last_verified_date = Column(String(50), default="2026-11-15")
    is_demo_data = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    translations = relationship("SchemeTranslation", back_populates="scheme", cascade="all, delete-orphan")
    rules = relationship("EligibilityRule", back_populates="scheme", cascade="all, delete-orphan")
    documents = relationship("SchemeDocument", back_populates="scheme", cascade="all, delete-orphan")
    sources = relationship("SchemeSource", back_populates="scheme", cascade="all, delete-orphan")
    saved_by = relationship("SavedScheme", back_populates="scheme", cascade="all, delete-orphan")
    action_plans = relationship("ActionPlan", back_populates="scheme", cascade="all, delete-orphan")

class SchemeTranslation(Base):
    __tablename__ = "scheme_translations"
    
    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    language = Column(String(10), nullable=False, index=True)  # kn, hi, ta, te, ml, mr
    
    name = Column(String(255), nullable=False)
    short_description = Column(Text, nullable=False)
    benefits = Column(Text, nullable=False)
    application_procedure = Column(Text, nullable=True)
    
    scheme = relationship("Scheme", back_populates="translations")

class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    
    field = Column(String(50), nullable=False)  # occupation, state, age, income, gender, disability, etc.
    operator = Column(String(20), nullable=False)  # eq, in, lte, gte, between, ne
    value = Column(String(255), nullable=False)  # "Farmer", "Karnataka,All", "60", "250000"
    description = Column(String(255), nullable=False)  # Human-readable criterion
    is_mandatory = Column(Boolean, default=True)
    
    scheme = relationship("Scheme", back_populates="rules")

class SchemeDocument(Base):
    __tablename__ = "scheme_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    
    document_name = Column(String(150), nullable=False)
    description = Column(String(255), nullable=True)
    is_mandatory = Column(Boolean, default=True)
    issuing_authority = Column(String(100), nullable=True)  # Revenue Dept, UIDAI, etc.
    
    scheme = relationship("Scheme", back_populates="documents")

class SchemeSource(Base):
    __tablename__ = "scheme_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(200), nullable=False)
    url = Column(String(500), nullable=False)
    source_type = Column(String(50), default="Government Portal")  # Portal, Gazette, Circular
    last_verified = Column(String(50), default="2026-11-15")
    
    scheme = relationship("Scheme", back_populates="sources")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    session_uuid = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(200), default="New Scheme Inquiry")
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.id")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    language = Column(String(10), default="en")
    
    # Structured recommendations payload
    recommended_schemes_json = Column(JSON, nullable=True)
    eligibility_breakdown_json = Column(JSON, nullable=True)
    missing_fields_json = Column(JSON, nullable=True)
    suggested_questions_json = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("ChatSession", back_populates="messages")

class EligibilityResult(Base):
    __tablename__ = "eligibility_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    
    overall_status = Column(String(20), nullable=False)  # PASSED, FAILED, UNKNOWN
    passed_criteria = Column(JSON, nullable=True)
    failed_criteria = Column(JSON, nullable=True)
    unknown_criteria = Column(JSON, nullable=True)
    summary_explanation = Column(Text, nullable=True)
    next_steps = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="eligibility_results")
    scheme = relationship("Scheme")

class SavedScheme(Base):
    __tablename__ = "saved_schemes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="saved_schemes")
    scheme = relationship("Scheme", back_populates="saved_by")

class UserDocument(Base):
    __tablename__ = "user_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_name = Column(String(150), nullable=False)
    status = Column(String(30), default="NOT_READY")  # READY, IN_PROGRESS, NOT_READY
    is_uploaded = Column(Boolean, default=False)
    file_path = Column(String(500), nullable=True)
    notes = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="user_documents")

class ActionPlan(Base):
    __tablename__ = "action_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(30), default="IN_PROGRESS")  # NOT_STARTED, IN_PROGRESS, COMPLETED
    progress_percentage = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="action_plans")
    scheme = relationship("Scheme", back_populates="action_plans")
    steps = relationship("ActionPlanStep", back_populates="plan", cascade="all, delete-orphan", order_by="ActionPlanStep.step_number")

class ActionPlanStep(Base):
    __tablename__ = "action_plan_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("action_plans.id", ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    is_completed = Column(Boolean, default=False)
    action_url = Column(String(500), nullable=True)
    action_label = Column(String(100), nullable=True)
    
    plan = relationship("ActionPlan", back_populates="steps")

class UserFeedback(Base):
    __tablename__ = "user_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="feedbacks")

class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="ADMIN")  # SUPERADMIN, ADMIN, EDITOR
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
