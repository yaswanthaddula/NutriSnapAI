from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import uuid
import models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[schemas.NotificationEventResponse])
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.NotificationEvent).filter(
        models.NotificationEvent.user_id == current_user.id,
        models.NotificationEvent.status != "Cleared"
    ).order_by(models.NotificationEvent.created_at.desc()).all()

@router.put("/{notification_id}/read", response_model=schemas.NotificationEventResponse)
def read_notification(notification_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notification = db.query(models.NotificationEvent).filter(
        models.NotificationEvent.id == notification_id,
        models.NotificationEvent.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.status = "Read"
    notification.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notification)
    return notification

@router.put("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notifications = db.query(models.NotificationEvent).filter(
        models.NotificationEvent.user_id == current_user.id,
        models.NotificationEvent.status == "Unread"
    ).all()

    now = datetime.now(timezone.utc)
    for notif in notifications:
        notif.status = "Read"
        notif.read_at = now

    db.commit()
    return {"detail": f"Marked {len(notifications)} notifications as read"}

@router.put("/{notification_id}/clear", response_model=schemas.NotificationEventResponse)
def clear_notification(notification_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notification = db.query(models.NotificationEvent).filter(
        models.NotificationEvent.id == notification_id,
        models.NotificationEvent.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.status = "Cleared"
    notification.cleared_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notification)
    return notification

@router.put("/clear-all")
def clear_all_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notifications = db.query(models.NotificationEvent).filter(
        models.NotificationEvent.user_id == current_user.id,
        models.NotificationEvent.status != "Cleared"
    ).all()

    now = datetime.now(timezone.utc)
    for notif in notifications:
        notif.status = "Cleared"
        notif.cleared_at = now

    db.commit()
    return {"detail": f"Cleared {len(notifications)} notifications"}
