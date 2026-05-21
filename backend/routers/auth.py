from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserProfileUpdate, UserResponse
import io
import urllib.parse
from fastapi.responses import StreamingResponse
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from datetime import datetime

from pydantic import BaseModel

class UserStatusUpdate(BaseModel):
    status: str

class UserRoleUpdate(BaseModel):
    role: str

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1. Регистрация пользователя
@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    
    hashed_pwd = pwd_context.hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_pwd)

    if user.email == "admin@sibadi.org":
        new_user = User(email=user.email, hashed_password=hashed_pwd, status="approved", role="admin")
    else:
        new_user = User(email=user.email, hashed_password=hashed_pwd)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# 2. Вход (Логин)
@router.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    if db_user.status == "pending":
        raise HTTPException(status_code=403, detail="Ваш аккаунт ожидает подтверждения администратором")
    elif db_user.status == "rejected":
        raise HTTPException(status_code=403, detail="Доступ отклонен администратором")
        
    return {"message": "Успешный вход", "user_id": db_user.id, "role": db_user.role}

# 3. Обновление Анкеты и Расчет Грейда
@router.put("/profile/{user_id}")
def update_profile(user_id: int, profile: UserProfileUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    for key, value in profile.dict(exclude_unset=True).items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    
    exp = db_user.experience_years
    rinc = db_user.rinc_publications
    vak = db_user.vak_publications
    
    calculated_grade = "Не назначен (требования не выполнены)"
    
    if exp >= 3 and rinc >= 5 and vak >= 2:
        calculated_grade = "Грейд 3 (Высокий) - 25 000 руб."
    elif exp >= 2 and rinc >= 3 and vak >= 1:
        calculated_grade = "Грейд 2 (Средний) - 20 000 руб."
    elif exp >= 1 and rinc >= 1:
        calculated_grade = "Грейд 1 (Начальный) - 15 000 руб."

    return {
        "message": "Анкета успешно обновлена",
        "grade_prediction": calculated_grade,
        "profile": db_user
    }

# 4. Получить список пользователей, ожидающих проверки
@router.get("/users/pending")
def get_pending_users(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.status == "pending").all()
    return users

# 5. Одобрить или отклонить пользователя
@router.put("/users/{user_id}/status")
def update_user_status(user_id: int, status_data: UserStatusUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user.status = status_data.status
    db.commit()
    return {"message": f"Статус пользователя изменен на {status_data.status}"}

# 6. Получение данных профиля при входе
@router.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
        
    calculated_grade = None
    if user.full_name:
        exp = user.experience_years
        rinc = user.rinc_publications
        vak = user.vak_publications
        
        if exp >= 3 and rinc >= 5 and vak >= 2:
            calculated_grade = "Грейд 3 (Высокий) - 25 000 руб."
        elif exp >= 2 and rinc >= 3 and vak >= 1:
            calculated_grade = "Грейд 2 (Средний) - 20 000 руб."
        elif exp >= 1 and rinc >= 1:
            calculated_grade = "Грейд 1 (Начальный) - 15 000 руб."
        else:
            calculated_grade = "Не назначен (требования не выполнены)"
            
    return {"profile": user, "grade_prediction": calculated_grade}

# 7. Генерация и скачивание Анкеты в формате Word (по структуре из бота)
@router.get("/profile/{user_id}/export")
def export_profile_docx(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.full_name:
        raise HTTPException(status_code=400, detail="Профиль не заполнен")

    exp = user.experience_years
    rinc = user.rinc_publications
    vak = user.vak_publications
    
    grade_text = "Не назначен (требования не выполнены)"
    if exp >= 3 and rinc >= 5 and vak >= 2:
        grade_text = "Грейд 3 (Высокий) - 25 000 руб."
    elif exp >= 2 and rinc >= 3 and vak >= 1:
        grade_text = "Грейд 2 (Средний) - 20 000 руб."
    elif exp >= 1 and rinc >= 1:
        grade_text = "Грейд 1 (Начальный) - 15 000 руб."

    doc = Document()
    
    doc.add_heading('АНКЕТА И ИНДИВИДУАЛЬНЫЙ ПЛАН УЧАСТНИКА ПРОГРАММЫ ПОДДЕРЖКИ МОЛОДЫХ НАУЧНО-ПЕДАГОГИЧЕСКИХ РАБОТНИКОВ', level=1)
    
    # РАЗДЕЛ 1
    doc.add_heading('1. Данные о соискателе', level=2)
    table1 = doc.add_table(rows=11, cols=2)
    table1.style = 'Table Grid'
    
    formatted_birth_date = user.birth_date or ''
    if user.birth_date:
        try:
            date_obj = datetime.strptime(user.birth_date, "%Y-%m-%d")
            formatted_birth_date = date_obj.strftime("%d.%m.%Y")
        except ValueError:
            formatted_birth_date = user.birth_date

    data_mapping = [
        ('ФИО', user.full_name or ''),
        ('Дата рождения', formatted_birth_date),
        ('Образование соискателя (профиль, год выпуска)', user.education or ''),
        ('Место работы (кафедра)', user.department or ''),
        ('Должность', user.position or ''),
        ('Доля ставки', ''), 
        ('Стаж работы в вузе', f"{user.experience_years} лет"),
        ('Сведения об обучении в аспирантуре (год поступления)', ''),
        ('Место обучения, специальность, научный руководитель', ''),
        ('Условия участия в программе (впервые / год участия)', ''),
        ('Заявляемый уровень грейда на отчетный период', grade_text)
    ]

    for i, (key, val) in enumerate(data_mapping):
        table1.cell(i, 0).text = str(key)
        table1.cell(i, 1).text = str(val)

    # РАЗДЕЛ 2
    doc.add_heading('\n2. Сведения о научных достижениях соискателя', level=2)
    
    doc.add_paragraph('2.1. Перечень опубликованных изданий и научных трудов (за последние 5 лет)')
    table2 = doc.add_table(rows=2, cols=6)
    table2.style = 'Table Grid'
    headers2 = ['№ п/п', 'Наименование', 'Форма', 'Выходные данные', 'Объем', 'Соавторы']
    for i, h in enumerate(headers2): 
        table2.cell(0, i).text = h

    doc.add_paragraph('\n2.2. Участие во всероссийских и международных конференциях (за последние 5 лет)')
    table3 = doc.add_table(rows=2, cols=4)
    table3.style = 'Table Grid'
    headers3 = ['№', 'Наименование конференции', 'Место, даты', 'Форма участия']
    for i, h in enumerate(headers3): 
        table3.cell(0, i).text = h

    doc.add_paragraph('\n2.3. Участие в грантах (за последние 5 лет)')
    table4 = doc.add_table(rows=2, cols=3)
    table4.style = 'Table Grid'
    headers4 = ['№', 'Наименование проекта, сроки', 'Роль в проекте']
    for i, h in enumerate(headers4): 
        table4.cell(0, i).text = h

    # РАЗДЕЛ 3
    doc.add_heading('\n3. Планируемые результаты участия в программе', level=2)
    doc.add_paragraph(f'3.1. Заявляемый уровень грейда: {grade_text}')
    doc.add_paragraph('3.2. Результаты участия в программе:')
    
    table5 = doc.add_table(rows=3, cols=2) 
    table5.style = 'Table Grid'
    table5.cell(0, 0).text = 'Показатель'
    table5.cell(0, 1).text = 'Значение показателя'
    
    table5.cell(1, 0).text = 'Научная статья, опубликованная в издании ВАК'
    table5.cell(1, 1).text = f"{user.vak_publications} шт."
    table5.cell(2, 0).text = 'Научная публикация, включенная в РИНЦ'
    table5.cell(2, 1).text = f"{user.rinc_publications} шт."

    # ПОДПИСИ
    doc.add_paragraph('\n\nУчастник: _________________ / _________________')
    doc.add_paragraph('Наставник: _________________ / _________________')
    doc.add_paragraph('Заведующий кафедрой: _________________ / _________________')

    file_stream = io.BytesIO()
    doc.save(file_stream)
    file_stream.seek(0)
    
    filename = f"Anketa_{user.full_name.replace(' ', '_')}.docx"
    encoded_filename = urllib.parse.quote(filename)
    
    headers = {
        'Content-Disposition': f"attachment; filename*=utf-8''{encoded_filename}"
    }
    return StreamingResponse(file_stream, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers=headers)

# 8. Получить список ВООБЩЕ ВСЕХ пользователей (для админ-панели)
@router.get("/users/all")
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# 9. Изменить роль пользователя (Админом на сайте)
@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, role_data: UserRoleUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if role_data.role not in ["user", "mentor", "admin"]:
        raise HTTPException(status_code=400, detail="Неверная роль")
        
    user.role = role_data.role
    db.commit()
    return {"message": f"Роль пользователя изменена на {role_data.role}"}

# 10. Сбор статистики для дашборда аналитики
@router.get("/analytics/stats")
def get_analytics_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).filter(User.role == "user").count()
    total_mentors = db.query(User).filter(User.role == "mentor").count()
    
    all_npr = db.query(User).filter(User.role == "user").all()
    grades_dist = {"Грейд 1": 0, "Грейд 2": 0, "Грейд 3": 0, "Не назначен": 0}
    
    for u in all_npr:
        if u.full_name:
            exp = u.experience_years
            rinc = u.rinc_publications
            vak = u.vak_publications
            if exp >= 3 and rinc >= 5 and vak >= 2:
                grades_dist["Грейд 3"] += 1
            elif exp >= 2 and rinc >= 3 and vak >= 1:
                grades_dist["Грейд 2"] += 1
            elif exp >= 1 and rinc >= 1:
                grades_dist["Грейд 1"] += 1
            else:
                grades_dist["Не назначен"] += 1
        else:
            grades_dist["Не назначен"] += 1

    from models import Ticket
    total_tickets = db.query(Ticket).count()
    resolved_tickets = db.query(Ticket).filter(Ticket.status == "resolved").count()
    pending_tickets = db.query(Ticket).filter(Ticket.status == "pending").count()

    return {
        "total_users": total_users,
        "total_mentors": total_mentors,
        "grades": grades_dist,
        "tickets": {
            "total": total_tickets,
            "resolved": resolved_tickets,
            "pending": pending_tickets
        }
    }