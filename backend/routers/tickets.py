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
    if not profile: raise HTTPException(status_code=404, detail="Профиль не найден")
    if profile.mentor_id is not None: raise HTTPException(status_code=400, detail="Наставник уже выбран")
    
    mentor = db.query(User).filter(User.id == data.mentor_id, User.role == "mentor").first()
    if not mentor: raise HTTPException(status_code=404, detail="Наставник не найден")
        
    profile.mentor_id = data.mentor_id
    db.commit()
    return {"message": "Наставник успешно закреплен", "mentor_id": profile.mentor_id}

@router.post("/create/{user_id}", response_model=TicketResponse)
def create_ticket(user_id: int, ticket_data: TicketCreate, db: Session = Depends(get_db)):
    profile = db.query(NprProfile).filter(NprProfile.user_id == user_id).first()
    if not profile or not profile.mentor_id:
        raise HTTPException(status_code=400, detail="Сначала выберите наставника")
        
    new_ticket = Ticket(
        user_id=user_id,
        mentor_id=profile.mentor_id,
        question=ticket_data.question,
        status="pending"
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

@router.get("/my-tickets/{user_id}", response_model=list[TicketResponse])
def get_my_tickets(user_id: int, db: Session = Depends(get_db)):
    return db.query(Ticket).filter(Ticket.user_id == user_id).all()

@router.get("/mentor-tickets/{mentor_id}")
def get_mentor_tickets(mentor_id: int, db: Session = Depends(get_db)):
    tickets = db.query(Ticket).filter(Ticket.mentor_id == mentor_id).all()
    result = []
    for t in tickets:
        author = db.query(User).filter(User.id == t.user_id).first()
        name = author.npr_profile.full_name if author and author.npr_profile and author.npr_profile.full_name else author.email
        result.append({
            "id": t.id, "user_id": t.user_id, "mentor_id": t.mentor_id, "question": t.question,
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
    return ticket