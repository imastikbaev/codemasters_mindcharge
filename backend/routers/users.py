from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserRole
from schemas import UserOut
from services.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=List[UserOut])
def list_users(
    current_user: User = Depends(require_roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.PSYCHOLOGIST)),
    db: Session = Depends(get_db)
):
    q = db.query(User).filter(User.role == UserRole.USER)
    if current_user.institution_id:
        q = q.filter(User.institution_id == current_user.institution_id)
    return [UserOut.model_validate(u) for u in q.all()]


@router.patch("/{user_id}/role")
def update_role(
    user_id: str,
    role: UserRole,
    current_user: User = Depends(require_roles(UserRole.DIRECTOR, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    return {"ok": True}


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return {"ok": True}


@router.patch("/me/language")
def update_language(
    language: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if language not in ("ru", "kz", "en"):
        raise HTTPException(status_code=400, detail="Invalid language")
    current_user.preferred_language = language
    db.commit()
    return {"language": language}
