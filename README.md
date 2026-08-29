# LangChain + Gemini + MongoDB Memory Chatbot

A beginner-friendly full-stack chatbot project:

- **Frontend:** React + Vite
- **Backend:** FastAPI
- **LLM:** Google Gemini through LangChain
- **Conversation memory:** `RunnableWithMessageHistory`
- **Persistent chat history:** MongoDB using `MongoDBChatMessageHistory`

## Architecture

```text
React + Vite
     |
     | HTTP JSON
     v
FastAPI
     |
     v
RunnableWithMessageHistory
     |
     +--> MongoDBChatMessageHistory --> MongoDB
     |
     v
ChatPromptTemplate --> Gemini
```

## Folder structure

```text
langchain-mongodb-chatbot/
├── README.md
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── chat.py
│       ├── config.py
│       └── main.py
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```

## 1. Backend setup

Open a terminal:

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install packages:

```bash
pip install -r requirements.txt
```

Create `.env` from `.env.example` and put your Gemini API key in it.

Example:

```env
GOOGLE_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=langchain_chatbot
MONGODB_COLLECTION=message_store
FRONTEND_ORIGIN=http://localhost:5173
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Test:

```text
http://localhost:8000/api/health
```

## 2. MongoDB

You can use either a local MongoDB server or MongoDB Atlas.

For local MongoDB, the default URI is:

```text
mongodb://localhost:27017
```

For Atlas, replace `MONGODB_URI` with your Atlas connection string.

You do not need to manually create the `chat_history` database or `message_store` collection; MongoDB will create them when data is written.

## 3. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
```

Create `.env` from `.env.example`:

```env
VITE_API_URL=http://localhost:8000
```

Run:

```bash
npm run dev
```

Open the URL shown by Vite, normally:

```text
http://localhost:5173
```

## 4. How memory works

The important backend pieces are:

```python
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a helpful AI assistant."),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{user_query}"),
    ]
)
```

Then the history factory:

```python
def get_session_history(session_id: str):
    return MongoDBChatMessageHistory(
        connection_string=None,
        client=mongo_client,
        session_id=session_id,
        database_name=MONGODB_DATABASE,
        collection_name=MONGODB_COLLECTION,
    )
```

Then:

```python
chat_with_memory = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="user_query",
    history_messages_key="chat_history",
)
```

Every request sends a `session_id`:

```json
{
  "session_id": "abc123",
  "message": "Give me a learning plan"
}
```

LangChain uses the session ID to retrieve that chat's MongoDB history and inject it into `chat_history` before calling Gemini. The new user and AI messages are then persisted back to MongoDB.

## API endpoints

### Health

```http
GET /api/health
```

### Chat

```http
POST /api/chat
Content-Type: application/json

{
  "session_id": "abc123",
  "message": "I want to learn AI"
}
```

### Get chat history

```http
GET /api/history/abc123
```

### Clear chat history

```http
DELETE /api/history/abc123
```

## Try the memory demo

1. Send: `I want to learn AI`
2. Send: `Give me a learning plan`
3. Close/reload the frontend.
4. The same session ID is kept in browser local storage, so the history can be loaded again from MongoDB.
5. Click **New chat** to create a separate session with separate history.

## Notes

This project intentionally keeps the frontend simple so you can understand the full flow before adding authentication, streaming responses, RAG, file upload, or a production database design.
