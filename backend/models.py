from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    status = Column(String, default="pending")
    role = Column(String, default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    npr_profile = relationship("NprProfile", foreign_keys="NprProfile.user_id", back_populates="user", uselist=False, cascade="all, delete-orphan")
    mentor_profile = relationship("MentorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    tickets_authored = relationship("Ticket", foreign_keys='Ticket.user_id', back_populates="author", cascade="all, delete-orphan")
    tickets_received = relationship("Ticket", foreign_keys='Ticket.mentor_id', back_populates="mentor", cascade="all, delete-orphan")
    chats = relationship("ChatSession", back_populates="owner", cascade="all, delete-orphan")

class NprProfile(Base):
    __tablename__ = "npr_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    full_name = Column(String, nullable=True)
    birth_date = Column(String, nullable=True)
    education = Column(String, nullable=True)
    department = Column(String, nullable=True)
    position = Column(String, nullable=True)
    experience_years = Column(Integer, default=0, nullable=False)
    vak_publications = Column(Integer, default=0, nullable=False)
    rinc_publications = Column(Integer, default=0, nullable=False)
    calculated_grade = Column(String, nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="npr_profile")

class MentorProfile(Base):
    __tablename__ = "mentor_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    full_name = Column(String, nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="mentor_profile")

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    author = relationship("User", foreign_keys=[user_id], back_populates="tickets_authored")
    mentor = relationship("User", foreign_keys=[mentor_id], back_populates="tickets_received")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(100), default="Новый диалог")
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    sender = Column(String(10), nullable=False)  
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ChatSession", back_populates="messages")