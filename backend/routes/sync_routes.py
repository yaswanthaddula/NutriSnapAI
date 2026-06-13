from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, date
import models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/sync", tags=["sync"])

@router.get("/reminder-statuses", response_model=List[schemas.ReminderStatusResponse])
def get_reminder_statuses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.ReminderStatus).filter(models.ReminderStatus.user_id == current_user.id).all()

@router.post("/reminder-statuses", response_model=schemas.ReminderStatusResponse)
def sync_reminder_status(status_in: schemas.ReminderStatusCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    target_date = status_in.date or datetime.now(timezone.utc).date()
    db_status = db.query(models.ReminderStatus).filter(
        models.ReminderStatus.user_id == current_user.id,
        models.ReminderStatus.date == target_date
    ).first()
    
    if db_status:
        db_status.breakfast = status_in.breakfast
        db_status.lunch = status_in.lunch
        db_status.dinner = status_in.dinner
        db_status.snack = status_in.snack
        db_status.workout = status_in.workout
        db_status.sleep = status_in.sleep
        db_status.water = status_in.water
    else:
        db_status = models.ReminderStatus(
            user_id=current_user.id,
            date=target_date,
            breakfast=status_in.breakfast,
            lunch=status_in.lunch,
            dinner=status_in.dinner,
            snack=status_in.snack,
            workout=status_in.workout,
            sleep=status_in.sleep,
            water=status_in.water
        )
        db.add(db_status)
    
    db.commit()
    db.refresh(db_status)
    return db_status

@router.get("/notifications", response_model=List[schemas.NotificationHistoryResponse])
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date()
    # Return today's notifications only to avoid bloat
    return db.query(models.NotificationHistory).filter(
        models.NotificationHistory.user_id == current_user.id,
        models.NotificationHistory.date == today
    ).order_by(models.NotificationHistory.created_at.desc()).all()

@router.post("/notifications", response_model=schemas.NotificationHistoryResponse)
def sync_notification(notif_in: schemas.NotificationHistoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    target_date = notif_in.date or datetime.now(timezone.utc).date()
    # Avoid duplicates by checking the unique key
    db_notif = db.query(models.NotificationHistory).filter(
        models.NotificationHistory.user_id == current_user.id,
        models.NotificationHistory.key == notif_in.key
    ).first()
    
    if db_notif:
        return db_notif
        
    db_notif = models.NotificationHistory(
        user_id=current_user.id,
        date=target_date,
        message=notif_in.message,
        title=notif_in.title,
        type=notif_in.type,
        mode=notif_in.mode,
        color=notif_in.color,
        icon=notif_in.icon,
        key=notif_in.key
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

@router.get("/steps", response_model=List[schemas.DailyStepResponse])
def get_steps(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.DailyStep).filter(models.DailyStep.user_id == current_user.id).all()

@router.post("/steps", response_model=schemas.DailyStepResponse)
def sync_steps(steps_in: schemas.DailyStepCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    target_date = steps_in.date or datetime.now(timezone.utc).date()
    db_step = db.query(models.DailyStep).filter(
        models.DailyStep.user_id == current_user.id,
        models.DailyStep.date == target_date
    ).first()
    
    if db_step:
        db_step.steps = steps_in.steps
        db_step.calories_burned = steps_in.calories_burned
    else:
        db_step = models.DailyStep(
            user_id=current_user.id,
            date=target_date,
            steps=steps_in.steps,
            calories_burned=steps_in.calories_burned
        )
        db.add(db_step)
        
    db.commit()
    db.refresh(db_step)
    return db_step
