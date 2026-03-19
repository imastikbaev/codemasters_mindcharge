from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, ChatSession, ChatMessage
from schemas import ChatMessageIn, ChatResponseOut, ChatMessageOut
from services.auth import get_current_user
from services.ai_analysis import chat_with_ai

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/chat", response_model=ChatResponseOut)
def chat(
    data: ChatMessageIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == data.session_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        session = ChatSession(user_id=current_user.id)
        db.add(session)
        db.commit()
        db.refresh(session)

    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at).all()

    messages = [{"role": m.role, "content": m.content} for m in history[-10:]]
    messages.append({"role": "user", "content": data.message})

    lang = data.language or current_user.preferred_language
    ai_response = chat_with_ai(messages, lang)

    user_msg = ChatMessage(session_id=session.id, role="user", content=data.message)
    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=ai_response.get("reply", "")
    )
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()

    return ChatResponseOut(
        session_id=session.id,
        reply=ai_response.get("reply", ""),
        actions=ai_response.get("actions", [])
    )


@router.get("/chat/sessions")
def list_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.created_at.desc()).limit(20).all()
    return [{"id": s.id, "created_at": s.created_at} for s in sessions]


@router.get("/chat/sessions/{session_id}/messages", response_model=List[ChatMessageOut])
def get_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return [ChatMessageOut.model_validate(m) for m in session.messages]
