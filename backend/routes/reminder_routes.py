from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.post("", response_model=schemas.ReminderResponse)
def create_reminder(reminder_in: schemas.ReminderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.Reminder).filter(
        models.Reminder.user_id == current_user.id,
        models.Reminder.reminder_type == reminder_in.reminder_type
    ).first()

    now = datetime.now(timezone.utc)

    # Simple next_trigger_at calculation for today's time if enabled
    # A robust calculation would need the user's timezone, but for now we set it basically
    # Frontend handles robust scheduling via native. This is for DB status.
    if existing:
        for key, value in reminder_in.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        existing.updated_at = now
        existing.status = "Upcoming"
        db.commit()
        db.refresh(existing)
        return existing

    new_reminder = models.Reminder(
        **reminder_in.model_dump(),
        user_id=current_user.id,
        created_at=now,
        updated_at=now
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    return new_reminder

@router.get("", response_model=List[schemas.ReminderResponse])
def get_reminders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Reminder).filter(models.Reminder.user_id == current_user.id).all()

@router.get("/today", response_model=List[schemas.ReminderResponse])
def get_today_reminders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Note: Complex date filtering matching local timezone is best done partly on frontend or with timezone-aware queries.
    # But we return all enabled reminders and frontend filters exactly for "today",
    # OR we return all of them and frontend filters for today to ensure offline-capability accuracy.
    # Returning all enabled to let frontend do the exact local 'today' matching as it did before.
    return db.query(models.Reminder).filter(
        models.Reminder.user_id == current_user.id,
        models.Reminder.is_enabled == True
    ).all()

@router.put("/{reminder_id}", response_model=schemas.ReminderResponse)
def update_reminder(reminder_id: uuid.UUID, reminder_in: schemas.ReminderUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    for key, value in reminder_in.dict(exclude_unset=True).items():
        setattr(reminder, key, value)
    
    reminder.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(reminder)
    return reminder

@router.put("/{reminder_id}/status", response_model=schemas.ReminderResponse)
def update_reminder_status(reminder_id: uuid.UUID, status: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    reminder.status = status
    if status == "Active":
        reminder.last_triggered_at = datetime.now(timezone.utc)
    elif status == "Completed":
        reminder.completed_at = datetime.now(timezone.utc)
    elif status == "Missed":
        reminder.missed_at = datetime.now(timezone.utc)

    reminder.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(reminder)
    return reminder

@router.post("/{reminder_id}/trigger", response_model=schemas.ReminderResponse)
def trigger_reminder(reminder_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    now = datetime.now(timezone.utc)
    reminder.status = "Active"
    reminder.last_triggered_at = now
    reminder.updated_at = now

    # Create notification event
    event = models.NotificationEvent(
        user_id=current_user.id,
        reminder_id=reminder.id,
        title=reminder.title,
        message=reminder.message,
        type=reminder.reminder_type,
        status="Unread",
        delivered_at=now
    )
    db.add(event)
    db.commit()
    db.refresh(reminder)
    return reminder

@router.post("/{reminder_id}/done", response_model=schemas.ReminderResponse)
def mark_reminder_done(reminder_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    now = datetime.now(timezone.utc)
    reminder.status = "Completed"
    reminder.completed_at = now
    reminder.updated_at = now

    # Also update notification event if exists
    event = db.query(models.NotificationEvent).filter(
        models.NotificationEvent.reminder_id == reminder_id,
        models.NotificationEvent.status != "Cleared"
    ).order_by(models.NotificationEvent.created_at.desc()).first()
    
    if event:
        event.action_taken = "Done"
        event.status = "Read"
        event.read_at = now

    db.commit()
    db.refresh(reminder)
    return reminder

@router.post("/{reminder_id}/snooze", response_model=schemas.ReminderResponse)
def snooze_reminder(reminder_id: uuid.UUID, minutes: int = 10, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    now = datetime.now(timezone.utc)
    reminder.status = "Snoozed"
    reminder.snooze_until = now + timedelta(minutes=minutes)
    reminder.next_trigger_at = reminder.snooze_until
    reminder.updated_at = now

    event = db.query(models.NotificationEvent).filter(
        models.NotificationEvent.reminder_id == reminder_id,
        models.NotificationEvent.status != "Cleared"
    ).order_by(models.NotificationEvent.created_at.desc()).first()
    
    if event:
        event.action_taken = "RemindLater"
        event.status = "Read"
        event.read_at = now

    db.commit()
    db.refresh(reminder)
    return reminder

@router.post("/{reminder_id}/dismiss", response_model=schemas.ReminderResponse)
def dismiss_reminder(reminder_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    now = datetime.now(timezone.utc)
    reminder.status = "Missed"  # Or keep Active but dismiss notification
    reminder.missed_at = now
    reminder.updated_at = now

    event = db.query(models.NotificationEvent).filter(
        models.NotificationEvent.reminder_id == reminder_id,
        models.NotificationEvent.status != "Cleared"
    ).order_by(models.NotificationEvent.created_at.desc()).first()
    
    if event:
        event.action_taken = "Dismiss"
        event.status = "Read"
        event.read_at = now

    db.commit()
    db.refresh(reminder)
    return reminder

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    db.delete(reminder)
    db.commit()
    return {"detail": "Reminder deleted successfully"}
