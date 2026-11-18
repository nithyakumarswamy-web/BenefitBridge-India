from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Scheme, CitizenProfile, SavedScheme, User
from app.schemas.schemas import SchemeOut, SchemeDetailOut
from app.services.eligibility_engine import evaluate_scheme_eligibility

router = APIRouter()

@router.get("", response_model=List[SchemeOut])
def list_schemes(
    search: Optional[str] = None,
    state: Optional[str] = None,
    level: Optional[str] = None,
    category: Optional[str] = None,
    occupation: Optional[str] = None,
    language: Optional[str] = "en",
    user_id: Optional[int] = 1,
    db: Session = Depends(get_db)
):
    query = db.query(Scheme).filter(Scheme.is_active == True)
    
    if level and level.lower() != "all":
        query = query.filter(Scheme.level.ilike(level))
        
    if category and category.lower() != "all":
        query = query.filter(Scheme.category.ilike(category))

    schemes = query.all()
    profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == user_id).first() if user_id else None

    results = []
    for s in schemes:
        # State filtering
        if state and state.lower() != "all":
            if s.level == "State" and s.applicable_state and s.applicable_state.lower() not in ["all", state.lower()]:
                continue

        # Search query matching
        if search:
            q = search.lower()
            text_corpus = f"{s.name} {s.short_description} {s.category} {s.target_beneficiaries} {s.authority}".lower()
            if q not in text_corpus:
                continue

        # Occupation matching
        if occupation and occupation.lower() != "all":
            occ_corpus = f"{s.target_beneficiaries} {s.short_description} {s.category}".lower()
            if occupation.lower() not in occ_corpus:
                # Also check eligibility rules
                occ_rule_match = any(
                    r.field == "occupation" and occupation.lower() in r.value.lower()
                    for r in s.rules
                )
                if not occ_rule_match:
                    continue

        # Translated text
        tr_name = None
        tr_desc = None
        tr_benefits = None
        if language and language != "en":
            for tr in s.translations:
                if tr.language == language:
                    tr_name = tr.name
                    tr_desc = tr.short_description
                    tr_benefits = tr.benefits
                    break

        # Eligibility status
        elig_status = None
        if profile:
            eval_res = evaluate_scheme_eligibility(s, profile)
            elig_status = eval_res.overall_status

        item = SchemeOut(
            id=s.id,
            code=s.code,
            name=s.name,
            authority=s.authority,
            level=s.level,
            applicable_state=s.applicable_state,
            category=s.category,
            target_beneficiaries=s.target_beneficiaries,
            short_description=s.short_description,
            benefits=s.benefits,
            financial_benefit_amount=s.financial_benefit_amount,
            official_apply_url=s.official_apply_url,
            official_source_url=s.official_source_url,
            last_verified_date=s.last_verified_date,
            is_demo_data=s.is_demo_data,
            translated_name=tr_name,
            translated_short_description=tr_desc,
            translated_benefits=tr_benefits,
            eligibility_status=elig_status
        )
        results.append(item)

    return results

@router.get("/{scheme_id}", response_model=SchemeDetailOut)
def get_scheme_detail(
    scheme_id: int,
    language: Optional[str] = "en",
    user_id: Optional[int] = 1,
    db: Session = Depends(get_db)
):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == user_id).first() if user_id else None
    elig_status = None
    if profile:
        eval_res = evaluate_scheme_eligibility(scheme, profile)
        elig_status = eval_res.overall_status

    tr_name = None
    tr_desc = None
    tr_benefits = None
    if language and language != "en":
        for tr in scheme.translations:
            if tr.language == language:
                tr_name = tr.name
                tr_desc = tr.short_description
                tr_benefits = tr.benefits
                break

    detail = SchemeDetailOut(
        id=scheme.id,
        code=scheme.code,
        name=scheme.name,
        authority=scheme.authority,
        level=scheme.level,
        applicable_state=scheme.applicable_state,
        category=scheme.category,
        target_beneficiaries=scheme.target_beneficiaries,
        short_description=scheme.short_description,
        full_description=scheme.full_description,
        benefits=scheme.benefits,
        financial_benefit_amount=scheme.financial_benefit_amount,
        application_procedure=scheme.application_procedure,
        important_conditions=scheme.important_conditions,
        official_apply_url=scheme.official_apply_url,
        official_source_url=scheme.official_source_url,
        last_verified_date=scheme.last_verified_date,
        is_demo_data=scheme.is_demo_data,
        translated_name=tr_name,
        translated_short_description=tr_desc,
        translated_benefits=tr_benefits,
        eligibility_status=elig_status,
        rules=[r for r in scheme.rules],
        documents=[d for d in scheme.documents],
        sources=[s for s in scheme.sources]
    )
    return detail

@router.post("/{scheme_id}/save")
def save_scheme(scheme_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    existing = db.query(SavedScheme).filter(
        SavedScheme.user_id == user_id,
        SavedScheme.scheme_id == scheme_id
    ).first()
    if not existing:
        saved = SavedScheme(user_id=user_id, scheme_id=scheme_id)
        db.add(saved)
        db.commit()
    return {"status": "saved", "scheme_id": scheme_id}

@router.delete("/{scheme_id}/save")
def unsave_scheme(scheme_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    saved = db.query(SavedScheme).filter(
        SavedScheme.user_id == user_id,
        SavedScheme.scheme_id == scheme_id
    ).first()
    if saved:
        db.delete(saved)
        db.commit()
    return {"status": "unsaved", "scheme_id": scheme_id}

@router.get("/user/saved", response_model=List[SchemeOut])
def get_user_saved_schemes(user_id: int = 1, db: Session = Depends(get_db)):
    saved_records = db.query(SavedScheme).filter(SavedScheme.user_id == user_id).all()
    scheme_ids = [s.scheme_id for s in saved_records]
    schemes = db.query(Scheme).filter(Scheme.id.in_(scheme_ids)).all()
    
    profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == user_id).first()
    results = []
    for s in schemes:
        elig_status = None
        if profile:
            eval_res = evaluate_scheme_eligibility(s, profile)
            elig_status = eval_res.overall_status

        results.append(SchemeOut(
            id=s.id,
            code=s.code,
            name=s.name,
            authority=s.authority,
            level=s.level,
            applicable_state=s.applicable_state,
            category=s.category,
            target_beneficiaries=s.target_beneficiaries,
            short_description=s.short_description,
            benefits=s.benefits,
            financial_benefit_amount=s.financial_benefit_amount,
            official_apply_url=s.official_apply_url,
            official_source_url=s.official_source_url,
            last_verified_date=s.last_verified_date,
            is_demo_data=s.is_demo_data,
            eligibility_status=elig_status
        ))
    return results
