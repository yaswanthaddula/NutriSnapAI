from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, date
import models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/sync", tags=["sync"])



@router.get("/steps", response_model=List[schemas.DailyStepResponse])
def get_steps(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.DailyStep).filter(
        models.DailyStep.user_id == current_user.id
    ).order_by(models.DailyStep.date.desc()).all()

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
