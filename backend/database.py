from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Указываем путь к файлу базы данных SQLite внутри папки backend
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# 2. Создаем "движок" для работы с БД
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 3. Создаем фабрику сессий (через нее мы будем делать запросы к БД)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Создаем базовый класс для наших будущих таблиц (моделей)
Base = declarative_base()

# 5. Вспомогательная функция (зависимость) для FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()