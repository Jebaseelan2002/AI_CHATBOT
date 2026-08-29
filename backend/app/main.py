from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .chat import chat_with_memory, get_session_history
from .config import FRONTEND_ORIGIN

app = FastAPI(title="LangChain MongoDB Chatbot API")

allowed_origins = [FRONTEND_ORIGIN] if FRONTEND_ORIGIN else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=10000)


class ChatResponse(BaseModel):
    session_id: str
    answer: str


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    try:
        response = chat_with_memory.invoke(
            {"user_query": request.message},
            config={
                "configurable": {
                    "session_id": request.session_id
                }
            },
        )

        return ChatResponse(
            session_id=request.session_id,
            answer=response.content,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/history/{session_id}")
def history(session_id: str) -> dict[str, Any]:
    try:
        chat_history = get_session_history(session_id)
        messages = []

        for message in chat_history.messages:
            messages.append(
                {
                    "role": "user" if message.type == "human" else "assistant",
                    "content": message.content,
                }
            )

        return {"session_id": session_id, "messages": messages}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.delete("/api/history/{session_id}")
def clear_history(session_id: str) -> dict[str, str]:
    try:
        get_session_history(session_id).clear()
        return {"message": "Chat history cleared", "session_id": session_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
