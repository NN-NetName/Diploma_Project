from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, auth, tickets
from services.llm_service import rag_service
import models
from database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Интеллектуальный ассистент НПР СибАДИ",
    description="Backend-часть системы поддержки молодых преподавателей",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    print("🚀 Инициализация подсистемы ИИ...")
    rag_service.initialize()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# Настройка CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(tickets.router)