from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from typing import List, Optional
from database import get_db
import models, schemas, auth, database

router = APIRouter(prefix="/ai-chat-history", tags=["AI Chat"])

@router.post("", response_model=schemas.AIChatHistoryResponse)
def save_chat_history(chat: schemas.AIChatHistoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_chat = models.AIChatHistory(**chat.model_dump(), user_id=current_user.id)
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

@router.get("", response_model=List[schemas.AIChatHistoryResponse])
def get_chat_history(mode: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.AIChatHistory).filter(models.AIChatHistory.user_id == current_user.id)
    if mode:
        query = query.filter(models.AIChatHistory.mode == mode)
    return query.order_by(models.AIChatHistory.created_at.desc()).all()

@router.delete("")
def clear_chat_history(mode: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.AIChatHistory).filter(models.AIChatHistory.user_id == current_user.id)
    if mode:
        query = query.filter(models.AIChatHistory.mode == mode)
    query.delete(synchronize_session=False)
    db.commit()
    return {"message": "Chat history cleared"}
