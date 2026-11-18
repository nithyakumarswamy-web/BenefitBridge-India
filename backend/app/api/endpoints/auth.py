from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.models import User, CitizenProfile, AdminUser
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut

router = APIRouter()

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if user_in.email:
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
            
    user = User(
        full_name=user_in.full_name or "Citizen User",
        email=user_in.email,
        phone_number=user_in.phone_number,
        hashed_password=get_password_hash(user_in.password or "Demo@12345"),
        preferred_language=user_in.preferred_language or "en"
    )
    db.add(user)
    db.flush()

    # Create empty citizen profile
    profile = CitizenProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user_id=user.id, full_name=user.full_name, role="CITIZEN")

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == login_data.email_or_phone) | (User.phone_number == login_data.email_or_phone)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email/phone or password")

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user_id=user.id, full_name=user.full_name, role="CITIZEN")

@router.post("/admin/login", response_model=Token)
def admin_login(login_data: UserLogin, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == login_data.email_or_phone).first()
    if not admin or not verify_password(login_data.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    token = create_access_token(f"admin_{admin.id}")
    return Token(access_token=token, token_type="bearer", user_id=admin.id, full_name=admin.full_name, role=admin.role)

@router.get("/me", response_model=UserOut)
def get_current_user(user_id: int = 1, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Fallback to demo farmer user
        user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
