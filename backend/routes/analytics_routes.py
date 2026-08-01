from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.post("/log", response_model=schemas.ActivityLogResponse)
def log_activity(
    log_in: schemas.ActivityLogCreate, 
    request: Request,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Detect platform from user agent if not provided
    platform = log_in.platform
    if not platform:
        user_agent = request.headers.get("user-agent", "").lower()
        is_mobile = "expo" in user_agent or "okhttp" in user_agent or "darwin" in user_agent or "android" in user_agent
        platform = "app" if is_mobile else "web"

    new_log = models.ActivityLog(
        user_id=current_user.id,
        action_type=log_in.action_type,
        description=log_in.description,
        platform=platform,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log
