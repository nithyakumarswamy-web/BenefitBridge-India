from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.models import Scheme, CitizenProfile, EligibilityResult
from app.schemas.schemas import EligibilityEvaluationOut
from app.services.eligibility_engine import evaluate_scheme_eligibility

router = APIRouter()

@router.post("/evaluate/{scheme_id}", response_model=EligibilityEvaluationOut)
def evaluate_scheme(scheme_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
        
    profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == user_id).first()
    evaluation = evaluate_scheme_eligibility(scheme, profile)

    # Save or update result record
    existing = db.query(EligibilityResult).filter(
        EligibilityResult.user_id == user_id,
        EligibilityResult.scheme_id == scheme_id
    ).first()

    if not existing:
        existing = EligibilityResult(user_id=user_id, scheme_id=scheme_id)
        db.add(existing)

    existing.overall_status = evaluation.overall_status
    existing.passed_criteria = [c.dict() for c in evaluation.passed_criteria]
    existing.failed_criteria = [c.dict() for c in evaluation.failed_criteria]
    existing.unknown_criteria = [c.dict() for c in evaluation.unknown_criteria]
    existing.summary_explanation = evaluation.summary_explanation
    existing.next_steps = evaluation.next_steps

    db.commit()
    return evaluation

@router.get("/summary")
def get_eligibility_summary(user_id: int = 1, db: Session = Depends(get_db)):
    profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == user_id).first()
    schemes = db.query(Scheme).filter(Scheme.is_active == True).all()

    passed_list = []
    unknown_list = []
    failed_list = []

    for s in schemes:
        res = evaluate_scheme_eligibility(s, profile)
        item = {
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "category": s.category,
            "status": res.overall_status,
            "summary": res.summary_explanation,
            "missing_fields": res.missing_fields
        }
        if res.overall_status == "PASSED":
            passed_list.append(item)
        elif res.overall_status == "UNKNOWN":
            unknown_list.append(item)
        else:
            failed_list.append(item)

    return {
        "total_evaluated": len(schemes),
        "passed_count": len(passed_list),
        "unknown_count": len(unknown_list),
        "failed_count": len(failed_list),
        "passed_schemes": passed_list,
        "unknown_schemes": unknown_list,
        "failed_schemes": failed_list
    }
