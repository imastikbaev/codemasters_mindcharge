from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Course, UserCourseProgress
from schemas import CourseOut, UserProgressOut
from services.auth import get_current_user

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=List[CourseOut])
def list_courses(
    theme: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Course)
    if theme:
        query = query.filter(Course.theme == theme)
    courses = query.all()
    return [CourseOut.model_validate(c) for c in courses]


@router.get("/{course_id}", response_model=CourseOut)
def get_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return CourseOut.model_validate(course)


@router.post("/{course_id}/start")
def start_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id,
        UserCourseProgress.course_id == course_id
    ).first()
    if existing:
        return {"id": existing.id, "message": "Already started"}

    progress = UserCourseProgress(
        user_id=current_user.id,
        course_id=course_id,
        current_module=0,
        completed_modules=[]
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return {"id": progress.id, "message": "Course started"}


@router.patch("/{course_id}/progress")
def update_progress(
    course_id: str,
    module_index: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id,
        UserCourseProgress.course_id == course_id
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found, start course first")

    completed = list(progress.completed_modules or [])
    if module_index not in completed:
        completed.append(module_index)
    progress.completed_modules = completed
    progress.current_module = module_index + 1

    course = db.query(Course).filter(Course.id == course_id).first()
    if course and len(completed) >= len(course.modules):
        progress.completed_at = datetime.utcnow()

    db.commit()
    return {"completed_modules": completed, "completed": progress.completed_at is not None}


@router.get("/progress/my", response_model=List[UserProgressOut])
def my_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prog = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id
    ).all()
    return [UserProgressOut.model_validate(p) for p in prog]
