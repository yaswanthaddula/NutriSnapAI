from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
import uuid
from datetime import datetime, date, time

# Auth Schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class EmailVerificationRequest(BaseModel):
    email: EmailStr
    code: str

class EmailCheckRequest(BaseModel):
    email: EmailStr

class RegisterStartRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class RegisterVerifyRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    code: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime
    last_active_platform: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Profile Schemas
class ProfileBase(BaseModel):
    age: int
    gender: str
    weight: float
    height: float
    bmi: float
    goal: str
    selected_mode: str
    suggested_mode: Optional[str] = None
    calorie_target: int
    protein_target: int
    breakfast_reminder_time: Optional[str] = None
    lunch_reminder_time: Optional[str] = None
    dinner_reminder_time: Optional[str] = None
    snack_reminder_time: Optional[str] = None
    water_reminder_interval: Optional[str] = None
    workout_reminder_time: Optional[str] = None
    sleep_reminder_time: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# Meal Schemas
class MealBase(BaseModel):
    food_name: str
    quantity: float
    unit: str
    calories: float
    protein: float
    carbs: float
    fat: float
    mode: Optional[str] = "health"

    @field_validator('quantity', 'calories', 'protein', 'carbs', 'fat', mode='before')
    @classmethod
    def parse_numeric(cls, v):
        if v is None:
            return 0.0
        if isinstance(v, str):
            try:
                return float(v.strip())
            except ValueError:
                return 0.0
        return v

class MealCreate(MealBase):
    date: str
    time: str

class MealResponse(MealBase):
    id: int
    user_id: int
    date: date
    time: time

    class Config:
        from_attributes = True

# Health Log Schemas
class HealthLogBase(BaseModel):
    date: Optional[Any] = None
    water_intake_ml: Optional[int] = 0
    water_goal_ml: Optional[int] = 2000
    sleep_hours: Optional[float] = 0.0
    sleep_score: Optional[int] = 0
    steps: Optional[int] = 0
    calories_burned: Optional[int] = 0
    mood: Optional[str] = None
    health_tip: Optional[str] = None

    @field_validator('date', mode='before')
    @classmethod
    def parse_date(cls, v):
        if v is None:
            return v
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            try:
                # Handle ISO strings from JS (e.g., 2026-05-12T...)
                if 'T' in v:
                    return datetime.fromisoformat(v.replace('Z', '+00:00')).date()
                return date.fromisoformat(v)
            except:
                return v
        return v

class HealthLogCreate(HealthLogBase):
    pass

class HealthLogResponse(HealthLogBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Gym Log Schemas
class GymLogBase(BaseModel):
    date: Optional[Any] = None
    workout_name: Optional[str] = None
    workout_status: Optional[str] = "pending"
    workout_duration_seconds: Optional[int] = 0
    workout_calories_burned: Optional[int] = 0
    protein_goal: Optional[int] = 0
    protein_consumed: Optional[int] = 0
    calories_goal: Optional[int] = 0
    calories_consumed: Optional[int] = 0

    @field_validator('date', mode='before')
    @classmethod
    def parse_date(cls, v):
        if v is None:
            return v
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            try:
                # Handle ISO strings from JS (e.g., 2026-05-12T...)
                if 'T' in v:
                    return datetime.fromisoformat(v.replace('Z', '+00:00')).date()
                return date.fromisoformat(v)
            except:
                return v
        return v

class GymLogCreate(GymLogBase):
    pass

class GymLogResponse(GymLogBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# AI Chat History Schemas
class AIChatHistoryBase(BaseModel):
    mode: str
    question: str
    answer: str

class AIChatHistoryCreate(AIChatHistoryBase):
    pass

class AIChatHistoryResponse(AIChatHistoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Reminder Schemas
class ReminderBase(BaseModel):
    mode: str = "health"
    reminder_type: str
    title: str
    message: str
    reminder_time: str
    repeat_type: Optional[str] = None
    repeat_days: Optional[str] = None
    is_enabled: bool = True
    status: str = "Upcoming"
    scheduled_notification_id: Optional[str] = None

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    mode: Optional[str] = None
    reminder_type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    reminder_time: Optional[str] = None
    repeat_type: Optional[str] = None
    repeat_days: Optional[str] = None
    is_enabled: Optional[bool] = None
    status: Optional[str] = None
    scheduled_notification_id: Optional[str] = None

class ReminderResponse(ReminderBase):
    id: uuid.UUID
    user_id: int
    next_trigger_at: Optional[datetime] = None
    last_triggered_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    missed_at: Optional[datetime] = None
    snooze_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# NotificationEvent Schemas
class NotificationEventBase(BaseModel):
    reminder_id: Optional[uuid.UUID] = None
    title: str
    message: str
    type: str
    status: str = "Unread"
    action_taken: Optional[str] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    cleared_at: Optional[datetime] = None

class NotificationEventCreate(NotificationEventBase):
    pass

class NotificationEventResponse(NotificationEventBase):
    id: uuid.UUID
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# DailyStep Schemas
class DailyStepBase(BaseModel):
    date: Optional[Any] = None
    steps: int = 0
    calories_burned: int = 0

    @field_validator('date', mode='before')
    @classmethod
    def parse_date(cls, v):
        if v is None:
            return v
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            try:
                if 'T' in v:
                    return datetime.fromisoformat(v.replace('Z', '+00:00')).date()
                return date.fromisoformat(v)
            except:
                return v
        return v

class DailyStepCreate(DailyStepBase):
    pass

class DailyStepResponse(DailyStepBase):
    id: int
    user_id: int
    updated_at: datetime

    class Config:
        from_attributes = True
