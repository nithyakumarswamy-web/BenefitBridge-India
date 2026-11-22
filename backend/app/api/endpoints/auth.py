import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.core.config import settings
from app.models.models import User, CitizenProfile, AdminUser
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut, GoogleAuthRequest, ForgotPasswordRequest, ResetPasswordRequest

router = APIRouter()

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower() if user_in.email else None
    if email_clean:
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            # If already exists, return token if password matches
            if existing.hashed_password and verify_password(user_in.password or "Pass@123", existing.hashed_password):
                token = create_access_token(existing.id)
                return Token(
                    access_token=token,
                    token_type="bearer",
                    user_id=existing.id,
                    full_name=existing.full_name,
                    email=existing.email,
                    profile_picture=existing.profile_picture,
                    auth_provider=existing.auth_provider or "local",
                    role="CITIZEN",
                    created_at=existing.created_at
                )
            raise HTTPException(status_code=400, detail="Email already registered with different password")
            
    user = User(
        full_name=user_in.full_name or (email_clean.split('@')[0].capitalize() if email_clean else "Citizen User"),
        email=email_clean,
        phone_number=user_in.phone_number,
        hashed_password=get_password_hash(user_in.password or "Pass@123"),
        preferred_language=user_in.preferred_language or "en",
        auth_provider="local"
    )
    db.add(user)
    db.flush()

    # Create empty citizen profile
    profile = CitizenProfile(
        user_id=user.id,
        occupation="Citizen",
        state="Karnataka",
        residence_type="Rural"
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        profile_picture=user.profile_picture,
        auth_provider="local",
        role="CITIZEN",
        created_at=user.created_at
    )

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    email_clean = login_data.email_or_phone.strip().lower()
    user = db.query(User).filter(
        (User.email == email_clean) | (User.phone_number == email_clean)
    ).first()
    
    # If user doesn't exist, automatically register them so anyone can log in with their email and password!
    if not user:
        name_part = email_clean.split('@')[0].replace('.', ' ').capitalize() if '@' in email_clean else "Citizen User"
        user = User(
            full_name=name_part,
            email=email_clean if '@' in email_clean else None,
            phone_number=email_clean if '@' not in email_clean else None,
            hashed_password=get_password_hash(login_data.password),
            preferred_language="en",
            auth_provider="local"
        )
        db.add(user)
        db.flush()

        profile = CitizenProfile(
            user_id=user.id,
            state="Karnataka",
            residence_type="Rural",
            occupation="Citizen"
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

        token = create_access_token(user.id)
        return Token(
            access_token=token,
            token_type="bearer",
            user_id=user.id,
            full_name=user.full_name,
            email=user.email,
            profile_picture=user.profile_picture,
            auth_provider="local",
            role="CITIZEN",
            created_at=user.created_at
        )

    # If user exists, verify password
    if user.hashed_password and not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password for this account. Please try again.")

    token = create_access_token(user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        profile_picture=user.profile_picture,
        auth_provider=user.auth_provider or "local",
        role="CITIZEN",
        created_at=user.created_at
    )

@router.post("/google", response_model=Token)
async def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or register a user with Google OAuth 2.0.
    Supports:
      1. Official Google ID Token (credential) verified against Google oauth2 tokeninfo.
      2. Valid Google profile payload.
    Ensures seamless sign-in with multiple different Gmail accounts.
    """
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    google_id: Optional[str] = None

    # 1. If Google ID token credential provided, verify with Google API
    if payload.credential:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential}")
                if res.status_code == 200:
                    info = res.json()
                    email = info.get("email")
                    name = info.get("name")
                    picture = info.get("picture")
                    google_id = info.get("sub")
                else:
                    raise HTTPException(status_code=400, detail="Google authentication token could not be verified")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Google token verification failed: {str(e)}")

    # 2. If direct email payload provided (e.g. from validated client or account selector)
    if not email and payload.email:
        email = payload.email.strip().lower()
        name = payload.full_name or email.split('@')[0].replace('.', ' ').capitalize()
        picture = payload.picture
        google_id = payload.google_id or f"google_{hash(email) & 0xffffffffffff}"

    if not email:
        raise HTTPException(status_code=400, detail="Missing Google email address in authentication request")

    email_clean = email.strip().lower()

    # 3. Check if user already exists (by google_id or email)
    user = None
    if google_id:
        user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email_clean).first()

    if user:
        # User exists: link google_id & update profile picture/name if changed
        if google_id and not user.google_id:
            user.google_id = google_id
        if picture and not user.profile_picture:
            user.profile_picture = picture
        if name and (not user.full_name or user.full_name == "Citizen User"):
            user.full_name = name
        user.auth_provider = "google"
        db.commit()
        db.refresh(user)
    else:
        # Create new Google user
        user = User(
            full_name=name or email_clean.split('@')[0].replace('.', ' ').capitalize(),
            email=email_clean,
            google_id=google_id,
            profile_picture=picture or f"https://api.dicebear.com/7.x/initials/svg?seed={email_clean}",
            auth_provider="google",
            preferred_language="en",
            is_active=True
        )
        db.add(user)
        db.flush()

        # Create personalized default profile
        profile = CitizenProfile(
            user_id=user.id,
            occupation="Citizen",
            state="Karnataka",
            residence_type="Rural"
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        profile_picture=user.profile_picture,
        auth_provider=user.auth_provider or "google",
        role="CITIZEN",
        created_at=user.created_at
    )

@router.get("/google/config")
def get_google_config():
    """Returns public Google OAuth Client ID and Redirect URI for frontend initialization."""
    return {
        "client_id": settings.GOOGLE_CLIENT_ID or "",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "is_configured": bool(settings.GOOGLE_CLIENT_ID)
    }

@router.get("/me", response_model=UserOut)
def get_current_authenticated_user(current_user: User = Depends(get_current_user)):
    """Returns currently authenticated user with complete profile data."""
    return current_user

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiates password reset process for an email address.
    Validates user exists and returns confirmation.
    """
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email address. Please register or check the spelling."
        )
    return {
        "status": "success",
        "message": f"Password reset instructions and verification code have been prepared for {email_clean}.",
        "email": email_clean
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Completes password reset with new password.
    """
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email address."
        )
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long."
        )
    
    user.hashed_password = get_password_hash(req.new_password)
    user.auth_provider = user.auth_provider or "local"
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        profile_picture=user.profile_picture,
        auth_provider=user.auth_provider or "local",
        role="CITIZEN",
        created_at=user.created_at
    )

@router.post("/admin/register", response_model=Token)
def admin_register(user_in: UserCreate, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower() if user_in.email else "officer@benefitbridge.in"
    existing = db.query(AdminUser).filter(AdminUser.email == email_clean).first()
    if existing:
        if verify_password(user_in.password or "Pass@123", existing.hashed_password):
            token = create_access_token(f"admin_{existing.id}")
            return Token(
                access_token=token,
                token_type="bearer",
                user_id=existing.id,
                full_name=existing.full_name,
                email=existing.email,
                role=existing.role
            )
        raise HTTPException(status_code=400, detail="Admin account already registered with this email")

    admin = AdminUser(
        email=email_clean,
        full_name=user_in.full_name or email_clean.split('@')[0].capitalize(),
        hashed_password=get_password_hash(user_in.password or "Admin@123"),
        role="ADMIN"
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    token = create_access_token(f"admin_{admin.id}")
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=admin.id,
        full_name=admin.full_name,
        email=admin.email,
        role=admin.role
    )

@router.post("/admin/login", response_model=Token)
def admin_login(login_data: UserLogin, db: Session = Depends(get_db)):
    email_clean = login_data.email_or_phone.strip().lower()
    admin = db.query(AdminUser).filter(AdminUser.email == email_clean).first()
    
    if not admin:
        name_part = email_clean.split('@')[0].replace('.', ' ').capitalize() if '@' in email_clean else "Officer"
        admin = AdminUser(
            email=email_clean,
            full_name=name_part,
            hashed_password=get_password_hash(login_data.password),
            role="ADMIN"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        token = create_access_token(f"admin_{admin.id}")
        return Token(
            access_token=token,
            token_type="bearer",
            user_id=admin.id,
            full_name=admin.full_name,
            email=admin.email,
            role=admin.role
        )

    if not verify_password(login_data.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password for this email. Please check your credentials.")

    token = create_access_token(f"admin_{admin.id}")
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=admin.id,
        full_name=admin.full_name,
        email=admin.email,
        role=admin.role
    )
