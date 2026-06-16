from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Time, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, date as dt_date, time as dt_time, timezone
from typing import Optional, List
import uuid
from sqlalchemy.dialects.postgresql import UUID
from database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    provider: Mapped[str] = mapped_column(String, default="local")
    is_verified: Mapped[int] = mapped_column(Integer, default=0)
    verification_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    verification_code_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reset_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    reset_code_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_active_platform: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    profile: Mapped["Profile"] = relationship("Profile", back_populates="user", uselist=False)
    meals: Mapped[List["Meal"]] = relationship("Meal", back_populates="user")
    health_logs: Mapped[List["HealthLog"]] = relationship("HealthLog", back_populates="user")
    gym_logs: Mapped[List["GymLog"]] = relationship("GymLog", back_populates="user")
    chat_history: Mapped[List["AIChatHistory"]] = relationship("AIChatHistory", back_populates="user")

class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    age: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(String)
    weight: Mapped[float] = mapped_column(Float)
    height: Mapped[float] = mapped_column(Float)
    bmi: Mapped[float] = mapped_column(Float)
    goal: Mapped[str] = mapped_column(String)
    selected_mode: Mapped[str] = mapped_column(String)
    suggested_mode: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    calorie_target: Mapped[int] = mapped_column(Integer)
    protein_target: Mapped[int] = mapped_column(Integer)

    # Reminder settings
    breakfast_reminder_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    lunch_reminder_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    dinner_reminder_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    snack_reminder_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    water_reminder_interval: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    workout_reminder_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sleep_reminder_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="profile")

class Meal(Base):
    __tablename__ = "meals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    food_name: Mapped[str] = mapped_column(String)
    quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String)
    calories: Mapped[float] = mapped_column(Float)
    protein: Mapped[float] = mapped_column(Float)
    carbs: Mapped[float] = mapped_column(Float)
    fat: Mapped[float] = mapped_column(Float)
    date: Mapped[dt_date] = mapped_column(Date, default=lambda: datetime.now(timezone.utc).date())
    time: Mapped[dt_time] = mapped_column(Time, default=lambda: datetime.now(timezone.utc).time())
    mode: Mapped[str] = mapped_column(String, default="health")

    user: Mapped["User"] = relationship("User", back_populates="meals")

class HealthLog(Base):
    __tablename__ = "health_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    date: Mapped[dt_date] = mapped_column(Date, default=lambda: datetime.now(timezone.utc).date())
    water_intake_ml: Mapped[int] = mapped_column(Integer, default=0)
    water_goal_ml: Mapped[int] = mapped_column(Integer, default=2000)
    sleep_hours: Mapped[float] = mapped_column(Float, default=0.0)
    sleep_score: Mapped[int] = mapped_column(Integer, default=0)
    steps: Mapped[int] = mapped_column(Integer, default=0)
    calories_burned: Mapped[int] = mapped_column(Integer, default=0)
    mood: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    health_tip: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="health_logs")

class GymLog(Base):
    __tablename__ = "gym_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    date: Mapped[dt_date] = mapped_column(Date, default=lambda: datetime.now(timezone.utc).date())
    workout_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    workout_status: Mapped[str] = mapped_column(String, default="pending")
    workout_duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    workout_calories_burned: Mapped[int] = mapped_column(Integer, default=0)
    protein_goal: Mapped[int] = mapped_column(Integer, default=0)
    protein_consumed: Mapped[int] = mapped_column(Integer, default=0)
    calories_goal: Mapped[int] = mapped_column(Integer, default=0)
    calories_consumed: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="gym_logs")

class AIChatHistory(Base):
    __tablename__ = "ai_chat_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    mode: Mapped[str] = mapped_column(String)
    question: Mapped[str] = mapped_column(String)
    answer: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="chat_history")

class PendingVerification(Base):
    __tablename__ = "pending_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    code: Mapped[str] = mapped_column(String)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    mode: Mapped[str] = mapped_column(String, default="health")
    reminder_type: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String)
    message: Mapped[str] = mapped_column(String)
    reminder_time: Mapped[str] = mapped_column(String)
    repeat_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    repeat_days: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String, default="Upcoming")
    next_trigger_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_triggered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    missed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    snooze_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_notification_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class NotificationEvent(Base):
    __tablename__ = "notification_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    reminder_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("reminders.id", ondelete="CASCADE"), nullable=True)
    title: Mapped[str] = mapped_column(String)
    message: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="Unread")
    action_taken: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cleared_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class DailyStep(Base):
    __tablename__ = "daily_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    date: Mapped[dt_date] = mapped_column(Date, default=lambda: datetime.now(timezone.utc).date())
    steps: Mapped[int] = mapped_column(Integer, default=0)
    calories_burned: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class SmartNotificationLog(Base):
    __tablename__ = "smart_notification_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    notification_type: Mapped[str] = mapped_column(String)
    date: Mapped[dt_date] = mapped_column(Date, default=lambda: datetime.now(timezone.utc).date())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User")
