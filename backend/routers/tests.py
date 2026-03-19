from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Test, TestSession, Course, AILevel, Notification
from schemas import TestOut, SubmitTestRequest, TestSessionOut
from services.auth import get_current_user
from services.scoring import calculate_score
from services.ai_analysis import analyze_test_with_ai

router = APIRouter(prefix="/api/tests", tags=["tests"])


@router.get("", response_model=List[TestOut])
def list_tests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tests = db.query(Test).all()
    return [TestOut.model_validate(t) for t in tests]


@router.get("/{test_id}", response_model=TestOut)
def get_test(
    test_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return TestOut.model_validate(test)


@router.post("/submit", response_model=TestSessionOut)
def submit_test(
    data: SubmitTestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    test = db.query(Test).filter(Test.id == data.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    raw, normalized, det_level = calculate_score(data.answers, test.questions)

    answers_summary = "\n".join(
        [f"Q{i+1}: {a}" for i, a in enumerate(data.answers)]
    )
    available_courses = db.query(Course).all()
    courses_list = [{"id": c.id, "name": c.name_ru} for c in available_courses]

    ai_result = analyze_test_with_ai(
        answers_summary=answers_summary,
        normalized_score=normalized,
        deterministic_level=det_level,
        age_group=current_user.age_group,
        language=current_user.preferred_language,
        available_courses=courses_list
    )

    final_level = ai_result.get("level", det_level)
    if isinstance(final_level, str):
        try:
            final_level = AILevel(final_level)
        except ValueError:
            final_level = det_level

    session = TestSession(
        user_id=current_user.id,
        test_id=data.test_id,
        answers_json=data.answers,
        raw_score=raw,
        normalized_score=normalized,
        ai_level=final_level,
        ai_summary=ai_result.get("summary", ""),
        ai_recommendations_json=ai_result.get("actions", []),
        completed_at=datetime.utcnow()
    )
    db.add(session)

    if final_level == AILevel.CRITICAL and current_user.institution_id:
        psychologists = db.query(User).filter(
            User.institution_id == current_user.institution_id,
            User.role == "psychologist"
        ).all()
        for psych in psychologists:
            notif = Notification(
                recipient_id=psych.id,
                type="critical_alert",
                payload_json={
                    "user_id": current_user.id,
                    "user_name": current_user.name,
                    "test_type": test.type,
                    "score": normalized
                }
            )
            db.add(notif)

    db.commit()
    db.refresh(session)
    return TestSessionOut.model_validate(session)


@router.get("/sessions/my", response_model=List[TestSessionOut])
def my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(TestSession)
        .filter(TestSession.user_id == current_user.id)
        .order_by(TestSession.completed_at.desc())
        .all()
    )
    return [TestSessionOut.model_validate(s) for s in sessions]
