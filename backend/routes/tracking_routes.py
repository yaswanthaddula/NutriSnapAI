from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from database import get_db
import models, schemas, auth, database

router = APIRouter(prefix="", tags=["Tracking"])

# Health Logs
@router.post("/health-logs", response_model=schemas.HealthLogResponse)
def create_or_update_health_log(log: schemas.HealthLogCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    try:
        # Check if a log for this user and date already exists
        log_date = log.date or date.today()
        existing_log = db.query(models.HealthLog).filter(
            models.HealthLog.user_id == current_user.id,
            models.HealthLog.date == log_date
        ).first()

        if existing_log:
            # Update existing log
            update_data = log.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(existing_log, key, value)
            db.commit()
            db.refresh(existing_log)
            return existing_log
        else:
            # Create new log
            db_log = models.HealthLog(**log.model_dump(), user_id=current_user.id)
            if not db_log.date:
                db_log.date = date.today() # type: ignore
            db.add(db_log)
            db.commit()
            db.refresh(db_log)
            return db_log
    except Exception as e:
        print(f"ERROR in create_or_update_health_log: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health-logs/today", response_model=schemas.HealthLogResponse)
def get_health_log_today(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    today = date.today()
    log = db.query(models.HealthLog).filter(
        models.HealthLog.user_id == current_user.id,
        models.HealthLog.date == today
    ).first()
    if not log:
        # Create an empty log for today if it doesn't exist
        log = models.HealthLog(user_id=current_user.id, date=today)
        db.add(log)
        db.commit()
        db.refresh(log)
    return log

@router.get("/health-logs/history", response_model=List[schemas.HealthLogResponse])
def get_health_log_history(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.HealthLog).filter(models.HealthLog.user_id == current_user.id).order_by(models.HealthLog.date.desc()).all()

# Gym Logs
@router.post("/gym-logs", response_model=schemas.GymLogResponse)
def create_or_update_gym_log(log: schemas.GymLogCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    try:
        log_date = log.date or date.today()
        existing_log = db.query(models.GymLog).filter(
            models.GymLog.user_id == current_user.id,
            models.GymLog.date == log_date
        ).first()

        if existing_log:
            update_data = log.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(existing_log, key, value)
            db.commit()
            db.refresh(existing_log)
            return existing_log
        else:
            db_log = models.GymLog(**log.model_dump(), user_id=current_user.id)
            if not db_log.date:
                db_log.date = date.today() # type: ignore
            db.add(db_log)
            db.commit()
            db.refresh(db_log)
            return db_log
    except Exception as e:
        print(f"ERROR in create_or_update_gym_log: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/gym-logs/today", response_model=schemas.GymLogResponse)
def get_gym_log_today(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    today = date.today()
    log = db.query(models.GymLog).filter(
        models.GymLog.user_id == current_user.id,
        models.GymLog.date == today
    ).first()
    if not log:
        log = models.GymLog(user_id=current_user.id, date=today)
        db.add(log)
        db.commit()
        db.refresh(log)
    return log

@router.get("/gym-logs/history", response_model=List[schemas.GymLogResponse])
def get_gym_log_history(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.GymLog).filter(models.GymLog.user_id == current_user.id).order_by(models.GymLog.date.desc()).all()
