from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import models, schemas, auth, database
import cloudinary
import cloudinary.uploader
import os

router = APIRouter(prefix="/upload", tags=["Upload"])

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

@router.post("/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        result = cloudinary.uploader.upload(
            file.file, 
            folder="profile_photos",
            transformation=[
                {'width': 500, 'height': 500, 'crop': 'fill', 'gravity': 'face'},
                {'quality': 'auto'}
            ]
        )
        secure_url = result.get('secure_url')
        
        # Update user's profile_image_url in database
        db_user = db.query(models.User).filter(models.User.id == current_user.id).first()
        if db_user:
            db_user.profile_image_url = secure_url
            db.commit()
            
        return {"url": secure_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

@router.post("/meal-photo")
async def upload_meal_photo(
    meal_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        # Verify meal belongs to user
        db_meal = db.query(models.Meal).filter(
            models.Meal.id == meal_id,
            models.Meal.user_id == current_user.id
        ).first()
        
        if not db_meal:
            raise HTTPException(status_code=404, detail="Meal not found")

        result = cloudinary.uploader.upload(
            file.file, 
            folder="meal_photos",
            transformation=[
                {'width': 800, 'crop': 'limit'},
                {'quality': 'auto'}
            ]
        )
        secure_url = result.get('secure_url')
        
        # Update meal's image url
        db_meal.meal_image_url = secure_url
        db.commit()
            
        return {"url": secure_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
