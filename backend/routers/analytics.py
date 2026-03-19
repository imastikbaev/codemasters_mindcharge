from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from models import User, TestSession, Course, UserCourseProgress, AILevel, UserRole, Notification
from schemas import AnalyticsOverview, GroupStatsOut
from services.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def analytics_overview(
    current_user: User = Depends(require_roles(UserRole.PSYCHOLOGIST, UserRole.DIRECTOR, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    inst_id = current_user.institution_id

    users_q = db.query(User).filter(User.role == UserRole.USER)
    if inst_id:
        users_q = users_q.filter(User.institution_id == inst_id)
    total_users = users_q.count()

    latest_sessions = db.query(TestSession).join(User).filter(
        User.role == UserRole.USER
    )
    if inst_id:
        latest_sessions = latest_sessions.filter(User.institution_id == inst_id)

    def count_level(level):
        return latest_sessions.filter(TestSession.ai_level == level).count()

    tests_completed = db.query(TestSession).join(User)
    if inst_id:
        tests_completed = tests_completed.filter(User.institution_id == inst_id)

    courses_completed = db.query(UserCourseProgress).join(User).filter(
        UserCourseProgress.completed_at.isnot(None)
    )
    if inst_id:
        courses_completed = courses_completed.filter(User.institution_id == inst_id)

    return AnalyticsOverview(
        total_users=total_users,
        norm_count=count_level(AILevel.NORM),
        elevated_count=count_level(AILevel.ELEVATED),
        burnout_risk_count=count_level(AILevel.BURNOUT_RISK),
        critical_count=count_level(AILevel.CRITICAL),
        tests_completed=tests_completed.count(),
        courses_completed=courses_completed.count()
    )


@router.get("/groups", response_model=List[GroupStatsOut])
def group_stats(
    current_user: User = Depends(require_roles(UserRole.PSYCHOLOGIST, UserRole.DIRECTOR, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    inst_id = current_user.institution_id
    users_q = db.query(User).filter(User.role == UserRole.USER, User.group_name.isnot(None))
    if inst_id:
        users_q = users_q.filter(User.institution_id == inst_id)

    groups = {}
    for user in users_q.all():
        gname = user.group_name or "Без группы"
        if gname not in groups:
            groups[gname] = {"norm": 0, "elevated": 0, "burnout_risk": 0, "critical": 0, "scores": []}

        last_session = db.query(TestSession).filter(
            TestSession.user_id == user.id,
            TestSession.ai_level.isnot(None)
        ).order_by(TestSession.completed_at.desc()).first()

        if last_session:
            lvl = last_session.ai_level if last_session.ai_level else "norm"
            groups[gname][lvl] = groups[gname].get(lvl, 0) + 1
            if last_session.normalized_score:
                groups[gname]["scores"].append(last_session.normalized_score)

    result = []
    for gname, data in groups.items():
        avg = sum(data["scores"]) / len(data["scores"]) if data["scores"] else 0
        result.append(GroupStatsOut(
            group_name=gname,
            norm=data.get("norm", 0),
            elevated=data.get("elevated", 0),
            burnout_risk=data.get("burnout_risk", 0),
            critical=data.get("critical", 0),
            avg_score=round(avg, 1)
        ))
    return result


@router.get("/critical-users")
def critical_users(
    current_user: User = Depends(require_roles(UserRole.PSYCHOLOGIST, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    inst_id = current_user.institution_id
    sessions = db.query(TestSession).join(User).filter(
        TestSession.ai_level == AILevel.CRITICAL
    )
    if inst_id:
        sessions = sessions.filter(User.institution_id == inst_id)

    result = []
    for s in sessions.order_by(TestSession.completed_at.desc()).limit(50).all():
        result.append({
            "session_id": s.id,
            "user_id": s.user_id,
            "user_name": s.user.name if s.user else "Unknown",
            "group_name": s.user.group_name if s.user else None,
            "score": s.normalized_score,
            "completed_at": s.completed_at,
        })
    return result


@router.get("/notifications/my")
def my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        Notification.recipient_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()
    return [
        {
            "id": n.id,
            "type": n.type,
            "payload": n.payload_json,
            "read": n.read_at is not None,
            "created_at": n.created_at
        }
        for n in notifs
    ]


@router.patch("/notifications/{notif_id}/read")
def mark_read(
    notif_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.recipient_id == current_user.id
    ).first()
    if notif:
        notif.read_at = datetime.utcnow()
        db.commit()
    return {"ok": True}
