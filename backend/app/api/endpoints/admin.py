from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.models import Scheme, User, EligibilityResult, UserFeedback, AdminUser, EligibilityRule, SchemeDocument
from app.schemas.schemas import AdminStatsOut, AdminSchemeCreate, SchemeOut
from app.core.config import settings

router = APIRouter()

@router.get("/stats", response_model=AdminStatsOut)
def get_admin_stats(db: Session = Depends(get_db)):
    total_schemes = db.query(Scheme).count()
    central_schemes = db.query(Scheme).filter(Scheme.level == "Central").count()
    state_schemes = db.query(Scheme).filter(Scheme.level == "State").count()
    total_users = db.query(User).count()
    total_evals = db.query(EligibilityResult).count()
    
    return AdminStatsOut(
        total_schemes=total_schemes,
        central_schemes=central_schemes,
        state_schemes=state_schemes,
        total_users=total_users,
        total_evaluations=total_evals,
        supported_languages_count=len(settings.SUPPORTED_LANGUAGES),
        categories_count=len(settings.CATEGORIES)
    )

@router.post("/schemes")
def create_scheme(scheme_in: AdminSchemeCreate, db: Session = Depends(get_db)):
    existing = db.query(Scheme).filter(Scheme.code == scheme_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Scheme code already exists")

    scheme = Scheme(
        code=scheme_in.code,
        name=scheme_in.name,
        authority=scheme_in.authority,
        level=scheme_in.level,
        applicable_state=scheme_in.applicable_state,
        category=scheme_in.category,
        target_beneficiaries=scheme_in.target_beneficiaries,
        short_description=scheme_in.short_description,
        full_description=scheme_in.full_description,
        benefits=scheme_in.benefits,
        financial_benefit_amount=scheme_in.financial_benefit_amount,
        application_procedure=scheme_in.application_procedure,
        important_conditions=scheme_in.important_conditions,
        official_apply_url=scheme_in.official_apply_url,
        official_source_url=scheme_in.official_source_url,
        last_verified_date="2026-11-18",
        is_demo_data=scheme_in.is_demo_data,
        is_active=True
    )
    db.add(scheme)
    db.flush()

    if scheme_in.rules:
        for r in scheme_in.rules:
            rule = EligibilityRule(
                scheme_id=scheme.id,
                field=r.get("field", "age"),
                operator=r.get("operator", "eq"),
                value=str(r.get("value", "")),
                description=r.get("description", "Eligibility criterion"),
                is_mandatory=r.get("is_mandatory", True)
            )
            db.add(rule)

    if scheme_in.documents:
        for d in scheme_in.documents:
            doc = SchemeDocument(
                scheme_id=scheme.id,
                document_name=d.get("document_name", "Document"),
                description=d.get("description", ""),
                is_mandatory=d.get("is_mandatory", True),
                issuing_authority=d.get("issuing_authority", "Govt")
            )
            db.add(doc)

    db.commit()
    db.refresh(scheme)
    return {"status": "created", "scheme_id": scheme.id, "name": scheme.name}

@router.put("/schemes/{scheme_id}")
def update_scheme(scheme_id: int, updates: Dict[str, Any], db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    for k, v in updates.items():
        if hasattr(scheme, k) and v is not None:
            setattr(scheme, k, v)

    db.commit()
    db.refresh(scheme)
    return {"status": "updated", "scheme_id": scheme.id}

@router.delete("/schemes/{scheme_id}")
def delete_scheme(scheme_id: int, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    db.delete(scheme)
    db.commit()
    return {"status": "deleted", "scheme_id": scheme_id}

@router.get("/feedbacks")
def get_feedbacks(db: Session = Depends(get_db)):
    feedbacks = db.query(UserFeedback).order_by(UserFeedback.created_at.desc()).all()
    return [{
        "id": f.id,
        "rating": f.rating,
        "comment": f.comment,
        "created_at": f.created_at
    } for f in feedbacks]

@router.post("/feedback")
def submit_feedback(rating: int, comment: str, user_id: int = 1, scheme_id: int = None, db: Session = Depends(get_db)):
    fb = UserFeedback(
        user_id=user_id,
        scheme_id=scheme_id,
        rating=rating,
        comment=comment
    )
    db.add(fb)
    db.commit()
    return {"status": "recorded"}
