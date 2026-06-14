from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.post("", response_model=schemas.ReminderResponse)
def create_reminder(reminder_in: schemas.ReminderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if a reminder of this type already exists for the user
    existing = db.query(models.Reminder).filter(
        models.Reminder.user_id == current_user.id,
        models.Reminder.reminder_type == reminder_in.reminder_type
    ).first()

    if existing:
        # Update existing
        for key, value in reminder_in.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing

    new_reminder = models.Reminder(
        **reminder_in.dict(),
        user_id=current_user.id
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
    # For now, return all enabled reminders
    return db.query(models.Reminder).filter(
        models.Reminder.user_id == current_user.id,
        models.Reminder.is_enabled == True
    ).all()

@router.put("/{reminder_id}", response_model=schemas.ReminderResponse)
def update_reminder(reminder_id: int, reminder_in: schemas.ReminderUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    for key, value in reminder_in.dict().items():
        setattr(reminder, key, value)
    
    reminder.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(reminder)
    return reminder

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    db.delete(reminder)
    db.commit()
    return {"detail": "Reminder deleted successfully"}
