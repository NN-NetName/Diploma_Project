from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Ticket
from schemas import MentorResponse, ChooseMentorRequest, TicketCreate, TicketAnswer, TicketResponse

router = APIRouter(prefix="/tickets", tags=["Mentorship & Tickets"])

# 1. Получить список всех одобренных наставников для выпадающего списка
@router.get("/mentors", response_model=list[MentorResponse])
def get_mentors(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == "mentor", User.status == "approved").all()

# 2. Закрепить наставника за пользователем (выполняется 1 раз)
@router.post("/choose-mentor/{user_id}")
def choose_mentor(user_id: int, data: ChooseMentorRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if user.mentor_id is not None:
        raise HTTPException(status_code=400, detail="Наставник уже выбран и заблокирован для изменений")
    
    mentor = db.query(User).filter(User.id == data.mentor_id, User.role == "mentor").first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Указанный наставник не найден или не прошел модерацию")
        
    user.mentor_id = data.mentor_id
    db.commit()
    return {"message": "Наставник успешно закреплен за вашим профилем", "mentor_id": user.mentor_id}

# 3. Создать новый тикет (вопрос от соискателя)
@router.post("/create/{user_id}", response_model=TicketResponse)
def create_ticket(user_id: int, ticket_data: TicketCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if not user.mentor_id:
        raise HTTPException(status_code=400, detail="Перед отправкой вопроса необходимо выбрать наставника")
        
    new_ticket = Ticket(
        user_id=user.id,
        mentor_id=user.mentor_id,
        question=ticket_data.question,
        status="pending"
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

# 4. Получить список всех своих тикетов (для молодого НПР)
@router.get("/my-tickets/{user_id}", response_model=list[TicketResponse])
def get_my_tickets(user_id: int, db: Session = Depends(get_db)):
    return db.query(Ticket).filter(Ticket.user_id == user_id).all()

# 5. Получить список тикетов, адресованных наставнику (для Панели наставника)
@router.get("/mentor-tickets/{mentor_id}")
def get_mentor_tickets(mentor_id: int, db: Session = Depends(get_db)):
    tickets = db.query(Ticket).filter(Ticket.mentor_id == mentor_id).all()
    result = []
    
    for t in tickets:
        author = db.query(User).filter(User.id == t.user_id).first()
        name = author.full_name if author and author.full_name else (author.email if author else "Неизвестный соискатель")
        
        t_dict = {
            "id": t.id,
            "user_id": t.user_id,
            "mentor_id": t.mentor_id,
            "question": t.question,
            "answer": t.answer,
            "status": t.status,
            "created_at": t.created_at,
            "updated_at": t.updated_at,
            "author_name": name
        }
        result.append(t_dict)
        
    return result

# 6. Отправить ответ на тикет (доступно только наставнику)
@router.put("/{ticket_id}/answer", response_model=TicketResponse)
def answer_ticket(ticket_id: int, answer_data: TicketAnswer, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Запрос (тикет) не найден")
        
    ticket.answer = answer_data.answer
    ticket.status = "resolved"
    db.commit()
    db.refresh(ticket)
    return ticket