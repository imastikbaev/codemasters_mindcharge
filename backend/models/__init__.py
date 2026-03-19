import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
import uuid
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    USER = "user"
    PSYCHOLOGIST = "psychologist"
    DIRECTOR = "director"
    ADMIN = "admin"


class AgeGroup(str, enum.Enum):
    CHILD = "child"
    TEEN = "teen"
    ADULT = "adult"


class AILevel(str, enum.Enum):
    NORM = "norm"
    ELEVATED = "elevated"
    BURNOUT_RISK = "burnout_risk"
    CRITICAL = "critical"


class Institution(Base):
    __tablename__ = "institutions"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    type = Column(String, default="school")
    settings_json = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    users = relationship("User", back_populates="institution")


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="user")
    age_group = Column(String, default="adult")
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True)
    group_name = Column(String, nullable=True)
    preferred_language = Column(String, default="ru")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="users")
    test_sessions = relationship("TestSession", back_populates="user")
    course_progress = relationship("UserCourseProgress", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")
    notifications = relationship("Notification", back_populates="recipient")


class Test(Base):
    __tablename__ = "tests"
    id = Column(String, primary_key=True, default=gen_uuid)
    type = Column(String, nullable=False)
    name_ru = Column(String, nullable=False)
    name_kz = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    description_ru = Column(Text)
    description_kz = Column(Text)
    description_en = Column(Text)
    age_group = Column(String, nullable=True)
    estimated_minutes = Column(Integer, default=10)
    questions = relationship("Question", back_populates="test", order_by="Question.order")
    sessions = relationship("TestSession", back_populates="test")


class Question(Base):
    __tablename__ = "questions"
    id = Column(String, primary_key=True, default=gen_uuid)
    test_id = Column(String, ForeignKey("tests.id"), nullable=False)
    order = Column(Integer, nullable=False)
    text_ru = Column(Text, nullable=False)
    text_kz = Column(Text, nullable=False)
    text_en = Column(Text, nullable=False)
    scale_min = Column(Integer, default=0)
    scale_max = Column(Integer, default=4)
    weight = Column(Float, default=1.0)
    reverse_scored = Column(Boolean, default=False)
    test = relationship("Test", back_populates="questions")


class TestSession(Base):
    __tablename__ = "test_sessions"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    test_id = Column(String, ForeignKey("tests.id"), nullable=False)
    answers_json = Column(JSON, default=[])
    raw_score = Column(Float, nullable=True)
    normalized_score = Column(Float, nullable=True)
    ai_level = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_recommendations_json = Column(JSON, default=[])
    consent_shared = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="test_sessions")
    test = relationship("Test", back_populates="sessions")


class Course(Base):
    __tablename__ = "courses"
    id = Column(String, primary_key=True, default=gen_uuid)
    theme = Column(String, nullable=False)
    variant = Column(String, nullable=False)
    name_ru = Column(String, nullable=False)
    name_kz = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    description_ru = Column(Text)
    description_kz = Column(Text)
    description_en = Column(Text)
    age_group = Column(String, nullable=True)
    estimated_hours = Column(Float, default=2.0)
    target_levels = Column(JSON, default=[])
    cover_url = Column(String, nullable=True)
    modules = relationship("CourseModule", back_populates="course", order_by="CourseModule.order")
    progress = relationship("UserCourseProgress", back_populates="course")


class CourseModule(Base):
    __tablename__ = "course_modules"
    id = Column(String, primary_key=True, default=gen_uuid)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    order = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    title_ru = Column(String)
    title_kz = Column(String)
    title_en = Column(String)
    content_json = Column(JSON, default={})
    course = relationship("Course", back_populates="modules")


class UserCourseProgress(Base):
    __tablename__ = "user_course_progress"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    current_module = Column(Integer, default=0)
    completed_modules = Column(JSON, default=[])
    completed_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="course_progress")
    course = relationship("Course", back_populates="progress")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ChatSession", back_populates="messages")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=gen_uuid)
    recipient_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    payload_json = Column(JSON, default={})
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    recipient = relationship("User", back_populates="notifications")
