from pydantic import BaseModel, Field
from datetime import datetime

# Схема для получения сообщения от пользователя
class MessageCreate(BaseModel):
    content: str

# Схема для отправки ответа обратно на сайт
class MessageResponse(BaseModel):
    id: int
    sender: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Схема для создания нового чата
class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Схемы для пользователей и анкеты
class UserCreate(BaseModel):
    email: str
    password: str = Field(..., min_length=8, max_length=16)

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    birth_date: str | None = None
    education: str | None = None
    department: str | None = None
    position: str | None = None
    experience_years: int = 0
    vak_publications: int = 0
    rinc_publications: int = 0

class UserResponse(BaseModel):
    id: int
    email: str
    status: str
    role: str
    full_name: str | None = None
    experience_years: int
    vak_publications: int
    rinc_publications: int

    class Config:
        from_attributes = True

# Схемы для системы наставничестве и тикетов
class MentorResponse(BaseModel):
    id: int
    email: str
    full_name: str | None = None

    class Config:
        from_attributes = True

class ChooseMentorRequest(BaseModel):
    mentor_id: int

class TicketCreate(BaseModel):
    question: str

class TicketAnswer(BaseModel):
    answer: str

class TicketResponse(BaseModel):
    id: int
    user_id: int
    mentor_id: int
    question: str
    answer: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime | None = None
    author_name: str | None = None

    class Config:
        from_attributes = True