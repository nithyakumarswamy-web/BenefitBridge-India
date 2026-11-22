import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.models.models import ChatSession, ChatMessage, CitizenProfile, User
from app.schemas.schemas import ChatMessageCreate, ChatMessageOut, ChatSessionOut
from app.services.rag_service import generate_grounded_response

router = APIRouter()

@router.post("/message", response_model=ChatMessageOut)
async def send_chat_message(
    payload: ChatMessageCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    target_user_id = current_user.id if current_user else 1

    # Retrieve or create session, strictly isolated to the user
    session = None
    if payload.session_uuid:
        session = db.query(ChatSession).filter(
            ChatSession.session_uuid == payload.session_uuid,
            ChatSession.user_id == target_user_id
        ).first()
    
    if not session:
        session = ChatSession(
            user_id=target_user_id,
            session_uuid=payload.session_uuid or str(uuid.uuid4()),
            title=payload.message[:30] + "...",
            language=payload.language or "en"
        )
        db.add(session)
        db.flush()

    # Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=payload.message,
        language=payload.language or "en"
    )
    db.add(user_msg)
    db.flush()

    profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == target_user_id).first()

    # Apply any explicit profile updates passed in payload
    if payload.profile_updates and profile:
        for k, v in payload.profile_updates.dict(exclude_unset=True).items():
            if v is not None:
                setattr(profile, k, v)
        db.commit()
        db.refresh(profile)

    # Generate grounded response
    response_data = await generate_grounded_response(
        db=db,
        user_message=payload.message,
        language=payload.language or "en",
        profile=profile
    )

    # Save assistant message
    asst_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=response_data["content"],
        language=response_data["language"],
        recommended_schemes_json=response_data["recommended_schemes"],
        eligibility_breakdown_json=response_data["eligibility_breakdowns"],
        missing_fields_json=response_data["missing_fields"],
        suggested_questions_json=response_data["suggested_questions"]
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    return ChatMessageOut(
        id=asst_msg.id,
        role=asst_msg.role,
        content=asst_msg.content,
        language=asst_msg.language,
        recommended_schemes=asst_msg.recommended_schemes_json,
        eligibility_breakdowns=asst_msg.eligibility_breakdown_json,
        missing_fields=asst_msg.missing_fields_json,
        suggested_questions=asst_msg.suggested_questions_json,
        created_at=asst_msg.created_at
    )

@router.get("/history/{session_uuid}", response_model=ChatSessionOut)
def get_chat_history(
    session_uuid: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    target_user_id = current_user.id if current_user else 1
    session = db.query(ChatSession).filter(
        ChatSession.session_uuid == session_uuid,
        ChatSession.user_id == target_user_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found or access denied")

    messages_out = []
    for m in session.messages:
        messages_out.append(ChatMessageOut(
            id=m.id,
            role=m.role,
            content=m.content,
            language=m.language,
            recommended_schemes=m.recommended_schemes_json,
            eligibility_breakdowns=m.eligibility_breakdown_json,
            missing_fields=m.missing_fields_json,
            suggested_questions=m.suggested_questions_json,
            created_at=m.created_at
        ))

    return ChatSessionOut(
        id=session.id,
        session_uuid=session.session_uuid,
        title=session.title,
        language=session.language,
        messages=messages_out
    )

@router.delete("/history/{session_uuid}")
def clear_chat_history(
    session_uuid: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    target_user_id = current_user.id if current_user else 1
    session = db.query(ChatSession).filter(
        ChatSession.session_uuid == session_uuid,
        ChatSession.user_id == target_user_id
    ).first()
    if session:
        db.delete(session)
        db.commit()
    return {"status": "cleared", "session_uuid": session_uuid}
