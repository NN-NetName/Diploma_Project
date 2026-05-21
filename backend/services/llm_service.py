import os
import re
import fitz
import faiss
from sentence_transformers import SentenceTransformer
from gigachat import GigaChat

GIGA_TOKEN = 'MDE5YjIxY2UtZjYwYS03NmY2LWJmMDQtZTdmNTNiZDE2OTRmOjFkODk0OTdlLTI0ODAtNDI5YS04YWE0LThkMmQ1N2I1M2YxNg=='

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_PATH = os.path.join(BASE_DIR, "docs", "reglament.pdf")

class RAGService:
    def __init__(self):
        self.knowledge_base = []
        self.faiss_index = None
        self.embedder = None
        
    def initialize(self):
        """Загружает модель, читает PDF и строит векторный индекс."""
        print("⏳ Загрузка модели эмбеддингов 'rubert-tiny2'...")
        self.embedder = SentenceTransformer('cointegrated/rubert-tiny2')
        
        if not os.path.exists(PDF_PATH):
            print(f"⚠️ ВНИМАНИЕ: Файл {PDF_PATH} не найден. Убедитесь, что положили его в папку docs!")
            return

        print("⏳ Чтение PDF и создание FAISS индекса...")
        doc = fitz.open(PDF_PATH)
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"
        
        clean_tables = """
        Таблица 1.1. Требуемые начальные показатели:
        - Грейд 1 (начальный): стаж от 1 года, публикации РИНЦ от 1 шт.
        - Грейд 2 (средний): стаж от 2 лет, публикации РИНЦ от 3 шт, публикации ВАК от 1 шт.
        - Грейд 3 (высокий): стаж от 3 лет, публикации РИНЦ от 5 шт, публикации ВАК от 2 шт.

        Таблица 1.3. Материальное стимулирование (ежемесячная надбавка):
        - Грейд 1: 15 000 рублей.
        - Грейд 2: 20 000 рублей.
        - Грейд 3: 25 000 рублей.
        """
        full_text += clean_tables
        full_text = re.sub(r'[ \t]+', ' ', full_text)
        
        split_patterns = [
            r"Таблица 1\.[1-4]", 
            r"Приложение \d",
            r"Раздел \d", 
            r"6\.1\. Материальная поддержка"
        ]
        
        marked_text = full_text
        for pattern in split_patterns:
            marked_text = re.sub(f"({pattern})", r"||SPLIT||\1", marked_text)
        
        raw_chunks = marked_text.split("||SPLIT||")
        self.knowledge_base = [ch.strip() for ch in raw_chunks if len(ch.strip()) > 30]
        
        print(f"✅ Текст регламента обработан: {len(self.knowledge_base)} блоков.")
        
        embeddings = self.embedder.encode(self.knowledge_base)
        dimension = embeddings.shape[1]
        self.faiss_index = faiss.IndexFlatL2(dimension)
        self.faiss_index.add(embeddings)
        print("✅ Векторная база FAISS готова к работе!")

    def find_relevant_context(self, query: str) -> str:
        """Ищет релевантные фрагменты гибридным методом."""
        if not self.faiss_index:
            return ""

        vector_results = []
        query_vector = self.embedder.encode([query])
        distances, indices = self.faiss_index.search(query_vector, k=5) 
        for idx in indices[0]:
            if idx != -1:
                vector_results.append(self.knowledge_base[idx])

        keyword_results = []
        query_words = re.findall(r'\w+', query.lower()) 
        query_words = [w for w in query_words if len(w) > 3 or w.isdigit()] 
        
        scored_chunks = []
        for chunk in self.knowledge_base:
            chunk_lower = chunk.lower()
            score = 0
            
            for word in query_words:
                if word in chunk_lower:
                    score += 1
            for word in query_words:
                if word.isdigit() and f"грейд {word}" in chunk_lower:
                     score += 10
            if any(w in chunk_lower for w in ["выплаты", "надбавка", "деньги", "стимулирование", "руб"]):
                 score += 5
                 
            if score > 0:
                scored_chunks.append((score, chunk))
        
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        keyword_results = [item[1] for item in scored_chunks[:3]]

        final_results = []
        seen = set()
        for res in keyword_results + vector_results:
            if res not in seen:
                final_results.append(res)
                seen.add(res)
                
        return "\n---\n".join(final_results[:3])

    def ask_gigachat(self, user_question: str, context: str) -> str:
        """Формирует промпт и отправляет запрос в нейросеть."""
        if not context: 
            return "Информация в регламенте не найдена. Пожалуйста, уточните ваш вопрос."
        
        prompt = (
            "Ты — официальный умный ассистент СибАДИ. Твоя задача — давать вежливые и точные ответы ТОЛЬКО на основе предоставленного текста регламента.\n"
            "ПРАВИЛА:\n"
            "1. Отвечай понятно, структурировано и по делу.\n"
            "2. Если ответа на вопрос совсем нет в тексте, ответь: 'В регламенте не указана информация по данному вопросу'.\n"
            "3. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО придумывать данные, которых нет в контексте.\n\n"
            f"Контекст из регламента:\n{context}\n\n"
            f"Вопрос: {user_question}"
        )
        
        try:
            with GigaChat(credentials=GIGA_TOKEN, verify_ssl_certs=False, timeout=90) as giga:
                response = giga.chat(prompt)
                return response.choices[0].message.content
        except Exception as e:
            return f"Ошибка интеграции с GigaChat API: {e}"

rag_service = RAGService()