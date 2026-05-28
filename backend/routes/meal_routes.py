from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import List
import models, schemas, auth, database

router = APIRouter(prefix="/meals", tags=["Meals"])

@router.post("/", response_model=schemas.MealResponse)
def add_meal(
    meal: schemas.MealCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_meal = models.Meal(**meal.model_dump(), user_id=current_user.id)
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)
    return new_meal

@router.get("/today", response_model=List[schemas.MealResponse])
def get_today_meals(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    today = date.today()
    meals = db.query(models.Meal).filter(
        models.Meal.user_id == current_user.id,
        models.Meal.date == today
    ).all()
    return meals

@router.delete("/{meal_id}")
def delete_meal(
    meal_id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    meal = db.query(models.Meal).filter(
        models.Meal.id == meal_id, 
        models.Meal.user_id == current_user.id
    ).first()
    
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    db.delete(meal)
    db.commit()
    return {"detail": "Meal deleted"}
