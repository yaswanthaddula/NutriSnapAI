from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth, database

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.post("", response_model=schemas.ProfileResponse)
def create_profile(
    profile: schemas.ProfileCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if profile already exists
    db_profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if db_profile:
        raise HTTPException(status_code=400, detail="Profile already exists. Use PUT to update.")
    
    new_profile = models.Profile(**profile.model_dump(), user_id=current_user.id)
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@router.get("", response_model=schemas.ProfileResponse)
def get_profile(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("", response_model=schemas.ProfileResponse)
def update_profile(
    profile_update: schemas.ProfileCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    for key, value in profile_update.model_dump().items():
        setattr(db_profile, key, value)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile
