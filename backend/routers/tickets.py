from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Ticket, NprProfile, MentorProfile
from schemas import MentorResponse, ChooseMentorRequest, TicketCreate, TicketAnswer, TicketResponse

router = APIRouter(prefix="/tickets", tags=["Mentorship & Tickets"])

@router.get("/mentors", response_model=list[MentorResponse])
def get_mentors(db: Session = Depends(get_db)):
    mentors = db.query(User).filter(User.role == "mentor", User.status == "approved").all()
    return [{"id": m.id, "email": m.email, "full_name": m.mentor_profile.full_name if m.mentor_profile else None} for m in mentors]

@router.post("/choose-mentor/{user_id}")
def choose_mentor(user_id: int, data: ChooseMentorRequest, db: Session = Depends(get_db)):
    profile = db.query(NprProfile).filter(NprProfile.user_id == user_id).first()
    if not profile: raise HTTPException(status_code=404, detail="Профиль соискателя не найден")
    if profile.mentor_id is not None: raise HTTPException(status_code=400, detail="Наставник уже выбран")
    
    mentor_user = db.query(User).filter(User.id == data.mentor_id, User.role == "mentor").first()
    if not mentor_user or not mentor_user.mentor_profile: 
        raise HTTPException(status_code=404, detail="Наставник не найден")
        
    profile.mentor_id = mentor_user.mentor_profile.id
    db.commit()
    return {"message": "Наставник успешно закреплен", "mentor_id": mentor_user.id}

@router.post("/create/{user_id}", response_model=TicketResponse)
def create_ticket(user_id: int, ticket_data: TicketCreate, db: Session = Depends(get_db)):
    profile = db.query(NprProfile).filter(NprProfile.user_id == user_id).first()
    if not profile or not profile.mentor_id:
        raise HTTPException(status_code=400, detail="Перед отправкой вопроса необходимо выбрать наставника")
        
    new_ticket = Ticket(
        user_id=profile.id,
        mentor_id=profile.mentor_id,
        question=ticket_data.question,
        status="pending"
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    return TicketResponse(
        id=new_ticket.id,
        user_id=user_id,
        mentor_id=profile.mentor_id,
        question=new_ticket.question,
        answer=new_ticket.answer,
        status=new_ticket.status,
        created_at=new_ticket.created_at,
        updated_at=new_ticket.updated_at
    )

@router.get("/my-tickets/{user_id}", response_model=list[TicketResponse])
def get_my_tickets(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(NprProfile).filter(NprProfile.user_id == user_id).first()
    if not profile: return []
    
    tickets = db.query(Ticket).filter(Ticket.user_id == profile.id).all()
    return [TicketResponse(
        id=t.id, user_id=user_id, mentor_id=t.mentor_id, question=t.question,
        answer=t.answer, status=t.status, created_at=t.created_at, updated_at=t.updated_at
    ) for t in tickets]

@router.get("/mentor-tickets/{mentor_id}")
def get_mentor_tickets(mentor_id: int, db: Session = Depends(get_db)):
    mentor_user = db.query(User).filter(User.id == mentor_id).first()
    if not mentor_user or not mentor_user.mentor_profile: return []
    
    tickets = db.query(Ticket).filter(Ticket.mentor_id == mentor_user.mentor_profile.id).all()
    result = []
    for t in tickets:
        author_profile = db.query(NprProfile).filter(NprProfile.id == t.user_id).first()
        author_user = db.query(User).filter(User.id == author_profile.user_id).first() if author_profile else None
        
        name = author_profile.full_name if author_profile and author_profile.full_name else (author_user.email if author_user else "Неизвестный соискатель")
        result.append({
            "id": t.id, "user_id": author_user.id if author_user else 0, "mentor_id": mentor_id, "question": t.question,
            "answer": t.answer, "status": t.status, "created_at": t.created_at, "updated_at": t.updated_at,
            "author_name": name
        })
    return result

@router.put("/{ticket_id}/answer", response_model=TicketResponse)
def answer_ticket(ticket_id: int, answer_data: TicketAnswer, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket: raise HTTPException(status_code=404, detail="Запрос не найден")
    ticket.answer = answer_data.answer
    ticket.status = "resolved"
    db.commit()
    db.refresh(ticket)
    
    author_profile = db.query(NprProfile).filter(NprProfile.id == ticket.user_id).first()
    u_id = author_profile.user_id if author_profile else 0
    
    return TicketResponse(
        id=ticket.id, user_id=u_id, mentor_id=ticket.mentor_id, question=ticket.question,
        answer=ticket.answer, status=ticket.status, created_at=ticket.created_at, updated_at=ticket.updated_at
    )