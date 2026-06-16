from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
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

@router.post("/smart/trigger")
def trigger_smart_notifications(req: schemas.SmartTriggerRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    today_date = now.date()
    hour = req.client_hour
    minute = req.client_minute
    time_float = hour + (minute / 60.0)

    logs = db.query(models.SmartNotificationLog).filter(
        models.SmartNotificationLog.user_id == current_user.id,
        models.SmartNotificationLog.date == today_date
    ).all()
    logged_types = [log.notification_type for log in logs]

    def add_smart_notif(n_type: str, title: str, message: str, icon: str):
        if n_type in logged_types:
            if n_type != 'water':
                return
            last_water = next((l for l in reversed(logs) if l.notification_type == 'water'), None)
            if last_water and (now - last_water.created_at).total_seconds() < 7200:
                return

        new_log = models.SmartNotificationLog(
            user_id=current_user.id,
            notification_type=n_type,
            date=today_date,
            created_at=now
        )
        db.add(new_log)

        new_event = models.NotificationEvent(
            user_id=current_user.id,
            title=title,
            message=message,
            type="Smart",
            status="Unread",
            created_at=now
        )
        db.add(new_event)
        logged_types.append(n_type)
        logs.append(new_log)

    if 7.0 <= time_float <= 9.5:
        breakfast_count = db.query(models.Meal).filter(
            models.Meal.user_id == current_user.id,
            models.Meal.meal_type.ilike('breakfast'),
            func.date(models.Meal.created_at) == today_date
        ).count()
        if breakfast_count == 0:
            add_smart_notif('breakfast', '🍳 Time for breakfast', 'Log your healthy breakfast.', 'food-apple')

    if 12.5 <= time_float <= 14.5:
        lunch_count = db.query(models.Meal).filter(
            models.Meal.user_id == current_user.id,
            models.Meal.meal_type.ilike('lunch'),
            func.date(models.Meal.created_at) == today_date
        ).count()
        if lunch_count == 0:
            add_smart_notif('lunch', '🍽️ Lunch time', "Don't forget your meal.", 'silverware-fork-knife')

    if 19.0 <= time_float <= 21.5:
        dinner_count = db.query(models.Meal).filter(
            models.Meal.user_id == current_user.id,
            models.Meal.meal_type.ilike('dinner'),
            func.date(models.Meal.created_at) == today_date
        ).count()
        if dinner_count == 0:
            add_smart_notif('dinner', '🌙 Dinner time', 'Track your dinner.', 'weather-night')

    if 21.5 <= time_float <= 23.0:
        add_smart_notif('sleep', '😴 Time to sleep', 'Recover well for tomorrow.', 'bed')

    if time_float >= 18.0:
        workout_count = db.query(models.Workout).filter(
            models.Workout.user_id == current_user.id,
            func.date(models.Workout.created_at) == today_date
        ).count()
        if workout_count == 0:
            add_smart_notif('workout', '🏋️ Your workout is pending', "Complete today's session.", 'dumbbell')

    db.commit()
    return {"detail": "Smart notifications evaluated"}
