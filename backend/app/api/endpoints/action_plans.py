from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.models.models import ActionPlan, ActionPlanStep, Scheme, User
from app.schemas.schemas import ActionPlanOut

router = APIRouter()

STANDARD_STEPS = [
    {
        "step_number": 1,
        "title": "Confirm Eligibility & Criteria",
        "description": "Review the scheme's criteria against your citizen profile to ensure all conditions (state, age, income) match.",
        "action_label": "Check Criteria"
    },
    {
        "step_number": 2,
        "title": "Collect Required Documents",
        "description": "Gather verified copies of Aadhaar, bank passbook, income certificate, and land/ration records listed in your Document Checklist.",
        "action_label": "Open Checklist"
    },
    {
        "step_number": 3,
        "title": "Visit Official Application Portal",
        "description": "Navigate directly to the official government portal or visit your nearest Grama One / CSC / Seva Kendra.",
        "action_label": "Go to Portal"
    },
    {
        "step_number": 4,
        "title": "Complete Online Application",
        "description": "Fill in personal details, bank DBT account number, and contact info accurately without errors.",
        "action_label": "Fill Form"
    },
    {
        "step_number": 5,
        "title": "Upload Documents & Authenticate",
        "description": "Submit scanned documents and authenticate using Aadhaar OTP / biometrics.",
        "action_label": "Submit Verification"
    },
    {
        "step_number": 6,
        "title": "Track Application & Acknowledgement",
        "description": "Save your Application Reference Number (ARN) / Acknowledgement slip and track status periodically.",
        "action_label": "Track Status"
    }
]

@router.get("", response_model=List[ActionPlanOut])
def get_user_action_plans(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    target_user_id = current_user.id if current_user else 1
    plans = db.query(ActionPlan).filter(ActionPlan.user_id == target_user_id).all()
    results = []
    for p in plans:
        results.append(ActionPlanOut(
            id=p.id,
            scheme_id=p.scheme_id,
            scheme_name=p.scheme.name if p.scheme else "Government Scheme",
            status=p.status,
            progress_percentage=p.progress_percentage,
            steps=[s for s in p.steps]
        ))
    return results

@router.post("/generate/{scheme_id}", response_model=ActionPlanOut)
def generate_action_plan(
    scheme_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    target_user_id = current_user.id if current_user else 1
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    existing = db.query(ActionPlan).filter(
        ActionPlan.user_id == target_user_id,
        ActionPlan.scheme_id == scheme_id
    ).first()

    if not existing:
        existing = ActionPlan(
            user_id=target_user_id,
            scheme_id=scheme_id,
            status="IN_PROGRESS",
            progress_percentage=16
        )
        db.add(existing)
        db.flush()

        for s in STANDARD_STEPS:
            act_url = scheme.official_apply_url if s["step_number"] == 3 else None
            step = ActionPlanStep(
                plan_id=existing.id,
                step_number=s["step_number"],
                title=s["title"],
                description=s["description"],
                is_completed=(s["step_number"] == 1),  # Step 1 auto-completed
                action_url=act_url,
                action_label=s["action_label"]
            )
            db.add(step)
        db.commit()
        db.refresh(existing)

    return ActionPlanOut(
        id=existing.id,
        scheme_id=existing.scheme_id,
        scheme_name=scheme.name,
        status=existing.status,
        progress_percentage=existing.progress_percentage,
        steps=[s for s in existing.steps]
    )

@router.put("/steps/{step_id}")
def update_step_status(
    step_id: int,
    is_completed: bool,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    step = db.query(ActionPlanStep).filter(ActionPlanStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    # Authorize step modification: must belong to active user if authenticated
    if current_user and step.plan and step.plan.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this action plan step")

    step.is_completed = is_completed
    plan = step.plan
    
    # Recalculate progress
    all_steps = plan.steps
    completed_count = sum(1 for s in all_steps if s.is_completed)
    total_steps = len(all_steps)
    progress = int((completed_count / total_steps) * 100) if total_steps > 0 else 0
    
    plan.progress_percentage = progress
    if progress == 100:
        plan.status = "COMPLETED"
    else:
        plan.status = "IN_PROGRESS"

    db.commit()
    db.refresh(step)
    return {
        "step_id": step.id,
        "is_completed": step.is_completed,
        "plan_progress": plan.progress_percentage,
        "status": plan.status
    }
