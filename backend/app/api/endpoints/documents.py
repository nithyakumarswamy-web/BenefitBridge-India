from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.models import Scheme, SavedScheme, UserDocument, SchemeDocument, CitizenProfile

router = APIRouter()

STANDARD_DOCUMENTS = [
    {"name": "Aadhaar Card", "reason": "Universal identity and biometric verification for DBT benefits", "mandatory": True, "category": "Identity"},
    {"name": "Ration Card (APL/BPL/AAY)", "reason": "Proof of economic classification and family members", "mandatory": True, "category": "Family"},
    {"name": "Bank Account Passbook (Aadhaar Seeded)", "reason": "Direct Benefit Transfer (DBT) credit account", "mandatory": True, "category": "Financial"},
    {"name": "Income Certificate", "reason": "Proof of household annual income threshold", "mandatory": True, "category": "Income"},
    {"name": "Land Record (RTC / Pahani / 7/12)", "reason": "Verification of cultivable agricultural landholding for farmer schemes", "mandatory": False, "category": "Property"},
    {"name": "Caste Certificate", "reason": "Verification for affirmative action or targeted welfare category", "mandatory": False, "category": "Social"},
    {"name": "Student ID / Admission Certificate", "reason": "Verification of active educational enrollment for scholarships", "mandatory": False, "category": "Education"}
]

@router.get("/checklist")
def get_document_checklist(user_id: int = 1, db: Session = Depends(get_db)):
    # Get user documents status
    user_docs = {ud.document_name: ud for ud in db.query(UserDocument).filter(UserDocument.user_id == user_id).all()}

    # Get documents required by user's saved schemes
    saved_schemes = db.query(SavedScheme).filter(SavedScheme.user_id == user_id).all()
    saved_scheme_ids = [s.scheme_id for s in saved_schemes]
    
    scheme_docs = db.query(SchemeDocument).filter(SchemeDocument.scheme_id.in_(saved_scheme_ids)).all() if saved_scheme_ids else []

    checklist = []
    seen = set()

    # Add standard government documents
    for doc in STANDARD_DOCUMENTS:
        name = doc["name"]
        seen.add(name)
        ud = user_docs.get(name)
        status = ud.status if ud else "NOT_READY"
        is_uploaded = ud.is_uploaded if ud else False

        checklist.append({
            "name": name,
            "reason": doc["reason"],
            "category": doc["category"],
            "is_mandatory": doc["mandatory"],
            "status": status,
            "is_uploaded": is_uploaded
        })

    # Add any scheme-specific docs not yet seen
    for sd in scheme_docs:
        if sd.document_name not in seen:
            seen.add(sd.document_name)
            ud = user_docs.get(sd.document_name)
            status = ud.status if ud else "NOT_READY"
            is_uploaded = ud.is_uploaded if ud else False

            checklist.append({
                "name": sd.document_name,
                "reason": sd.description or "Required for official scheme eligibility verification",
                "category": "Scheme Specific",
                "is_mandatory": sd.is_mandatory,
                "status": status,
                "is_uploaded": is_uploaded
            })

    ready_count = sum(1 for item in checklist if item["status"] == "READY")
    total_count = len(checklist)
    progress_percentage = int((ready_count / total_count) * 100) if total_count > 0 else 0

    return {
        "checklist": checklist,
        "ready_count": ready_count,
        "total_count": total_count,
        "progress_percentage": progress_percentage
    }

@router.post("/checklist/{doc_name}/status")
def update_document_status(doc_name: str, status: str, user_id: int = 1, db: Session = Depends(get_db)):
    doc = db.query(UserDocument).filter(
        UserDocument.user_id == user_id,
        UserDocument.document_name == doc_name
    ).first()

    if not doc:
        doc = UserDocument(user_id=user_id, document_name=doc_name)
        db.add(doc)

    doc.status = status.upper()
    db.commit()
    db.refresh(doc)
    return {"status": doc.status, "document_name": doc.document_name}

@router.post("/upload-demo")
async def demo_upload(doc_name: str, user_id: int = 1, db: Session = Depends(get_db)):
    doc = db.query(UserDocument).filter(
        UserDocument.user_id == user_id,
        UserDocument.document_name == doc_name
    ).first()

    if not doc:
        doc = UserDocument(user_id=user_id, document_name=doc_name)
        db.add(doc)

    doc.is_uploaded = True
    doc.status = "READY"
    doc.file_path = f"/demo_storage/{doc_name.lower().replace(' ', '_')}.pdf"
    doc.notes = "Demo verification passed (No sensitive biometric files stored)"
    db.commit()
    return {"status": "READY", "document_name": doc_name, "is_uploaded": True}
