from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db
from services.llm_service import rag_service

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/{user_id}/history", response_model=list[schemas.MessageResponse])
def get_chat_history(user_id: int, db: Session = Depends(get_db)):
    """Загружает историю диалога конкретного пользователя из базы данных"""
    session = db.query(models.ChatSession).filter(models.ChatSession.user_id == user_id).first()
    if not session:
        return []
    messages = db.query(models.Message).filter(models.Message.session_id == session.id).order_by(models.Message.created_at).all()
    return messages

@router.post("/{user_id}/message", response_model=schemas.MessageResponse)
def send_message(user_id: int, message: schemas.MessageCreate, db: Session = Depends(get_db)):
    """Принимает сообщение, ищет или создает индивидуальную сессию чата и возвращает ответ ИИ"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    session = db.query(models.ChatSession).filter(models.ChatSession.user_id == user_id).first()
    if not session:
        session = models.ChatSession(user_id=user_id)
        db.add(session)
        db.commit()
        db.refresh(session)

    user_msg = models.Message(session_id=session.id, sender="user", content=message.content)
    db.add(user_msg)
    db.commit()

    context = rag_service.find_relevant_context(message.content)
    ai_answer = rag_service.ask_gigachat(message.content, context)
    clean_ai_answer = ai_answer.replace("**", "").replace("*", "")

    bot_msg = models.Message(session_id=session.id, sender="bot", content=clean_ai_answer)
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)

    return bot_msg