from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.models.models import User, CitizenProfile, State, District
from app.schemas.schemas import CitizenProfileOut, CitizenProfileUpdate, StateOut

router = APIRouter()

def calculate_completion(profile: CitizenProfile) -> int:
    fields = [
        profile.age, profile.gender, profile.state, profile.district,
        profile.residence_type, profile.occupation, profile.income_range,
        profile.social_category, profile.education_level
    ]
    filled = sum(1 for f in fields if f is not None and str(f).strip() != "")
    return int((filled / len(fields)) * 100)

@router.get("/profile", response_model=CitizenProfileOut)
def get_profile(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    target_user_id = current_user.id if current_user else 1
    profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == target_user_id).first()
    if not profile:
        profile = CitizenProfile(
            user_id=target_user_id,
            occupation="Citizen",
            state="Karnataka",
            residence_type="Rural"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    out = CitizenProfileOut.from_orm(profile)
    out.completion_percentage = calculate_completion(profile)
    return out

@router.put("/profile", response_model=CitizenProfileOut)
def update_profile(
    profile_data: CitizenProfileUpdate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    target_user_id = current_user.id if current_user else 1
    profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == target_user_id).first()
    if not profile:
        profile = CitizenProfile(user_id=target_user_id)
        db.add(profile)
        db.flush()

    data_dict = profile_data.dict(exclude_unset=True)
    for key, value in data_dict.items():
        if value is not None:
            setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    out = CitizenProfileOut.from_orm(profile)
    out.completion_percentage = calculate_completion(profile)
    return out

@router.get("/states", response_model=List[StateOut])
def get_states(db: Session = Depends(get_db)):
    states = db.query(State).order_by(State.name).all()
    return states
