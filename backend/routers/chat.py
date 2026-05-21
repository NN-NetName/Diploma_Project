from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from services.llm_service import rag_service

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/{session_id}/message", response_model=schemas.MessageResponse)
def send_message(session_id: int, message: schemas.MessageCreate, db: Session = Depends(get_db)):
    """
    Принимает сообщение от пользователя, сохраняет его, 
    спрашивает GigaChat и возвращает ответ ИИ.
    """
    # 1. Проверяем, существует ли такой чат в базе
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session:
        session = models.ChatSession(id=session_id, user_id=1, title="Новый диалог")
        db.add(session)
        
        user = db.query(models.User).filter(models.User.id == 1).first()
        if not user:
            user = models.User(id=1, username="test_user", hashed_password="123")
            db.add(user)
            
        db.commit()

    # 2. Сохраняем сообщение пользователя в БД
    user_msg = models.Message(session_id=session_id, sender="user", content=message.content)
    db.add(user_msg)
    db.commit()

    # 3. Ищем умный контекст в базе FAISS
    context = rag_service.find_relevant_context(message.content)

    # 4. Отправляем запрос в GigaChat
    ai_answer = rag_service.ask_gigachat(message.content, context)
    
    clean_ai_answer = ai_answer.replace("**", "").replace("*", "")

    # 5. Сохраняем ответ ИИ в БД
    bot_msg = models.Message(session_id=session_id, sender="bot", content=clean_ai_answer)
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)

    # 6. Возвращаем ответ на сайт
    return bot_msg