from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel
from models import UserRole, AgeGroup, AILevel


class InstitutionOut(BaseModel):
    id: str
    name: str
    type: str
    class Config:
        from_attributes = True


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole = UserRole.USER
    age_group: AgeGroup = AgeGroup.ADULT
    institution_id: Optional[str] = None
    group_name: Optional[str] = None
    preferred_language: str = "ru"


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    age_group: AgeGroup
    preferred_language: str
    institution_id: Optional[str]
    group_name: Optional[str]
    class Config:
        from_attributes = True


class QuestionOut(BaseModel):
    id: str
    order: int
    text_ru: str
    text_kz: str
    text_en: str
    scale_min: int
    scale_max: int
    reverse_scored: bool
    class Config:
        from_attributes = True


class TestOut(BaseModel):
    id: str
    type: str
    name_ru: str
    name_kz: str
    name_en: str
    description_ru: Optional[str]
    description_kz: Optional[str]
    description_en: Optional[str]
    age_group: Optional[AgeGroup]
    estimated_minutes: int
    questions: List[QuestionOut] = []
    class Config:
        from_attributes = True


class SubmitTestRequest(BaseModel):
    test_id: str
    answers: List[int]


class TestSessionOut(BaseModel):
    id: str
    test_id: str
    raw_score: Optional[float]
    normalized_score: Optional[float]
    ai_level: Optional[AILevel]
    ai_summary: Optional[str]
    ai_recommendations_json: List[Any] = []
    consent_shared: bool
    completed_at: Optional[datetime]
    class Config:
        from_attributes = True


class CourseModuleOut(BaseModel):
    id: str
    order: int
    type: str
    title_ru: Optional[str]
    title_kz: Optional[str]
    title_en: Optional[str]
    content_json: Any
    class Config:
        from_attributes = True


class CourseOut(BaseModel):
    id: str
    theme: str
    variant: str
    name_ru: str
    name_kz: str
    name_en: str
    description_ru: Optional[str]
    description_kz: Optional[str]
    description_en: Optional[str]
    age_group: Optional[AgeGroup]
    estimated_hours: float
    target_levels: List[str] = []
    cover_url: Optional[str]
    modules: List[CourseModuleOut] = []
    class Config:
        from_attributes = True


class ChatMessageIn(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = "ru"


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime
    class Config:
        from_attributes = True


class ChatResponseOut(BaseModel):
    session_id: str
    reply: str
    actions: List[Any] = []


class AnalyticsOverview(BaseModel):
    total_users: int
    norm_count: int
    elevated_count: int
    burnout_risk_count: int
    critical_count: int
    tests_completed: int
    courses_completed: int


class GroupStatsOut(BaseModel):
    group_name: str
    norm: int
    elevated: int
    burnout_risk: int
    critical: int
    avg_score: float


class UserProgressOut(BaseModel):
    course_id: str
    current_module: int
    completed_modules: List[int]
    completed_at: Optional[datetime]
    started_at: datetime
    class Config:
        from_attributes = True
