import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "langchain_chatbot")
MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "message_store")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY is missing. Add it to backend/.env")
