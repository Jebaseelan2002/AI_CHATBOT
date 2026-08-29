from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_mongodb import MongoDBChatMessageHistory
from pymongo import MongoClient

from .config import (
    GEMINI_MODEL,
    MONGODB_URI,
    MONGODB_DATABASE,
    MONGODB_COLLECTION,
)

# Reuse one MongoDB client instead of opening a new client for every request.
mongo_client = MongoClient(MONGODB_URI)

# Create Gemini chat model.
llm = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL,
    temperature=0.7,
)

# Prompt with a placeholder where MongoDB-backed history will be inserted.
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful AI assistant. Answer clearly and naturally. "
            "Use the previous conversation when it is relevant."
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{user_query}"),
    ]
)

# Prompt -> Gemini
chain = prompt | llm


def get_session_history(session_id: str) -> MongoDBChatMessageHistory:
    """Return the MongoDB-backed message history for one chat session."""
    return MongoDBChatMessageHistory(
        connection_string=None,
        client=mongo_client,
        session_id=session_id,
        database_name=MONGODB_DATABASE,
        collection_name=MONGODB_COLLECTION,
    )


# Add automatic session-based message-history handling to the chain.
chat_with_memory = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="user_query",
    history_messages_key="chat_history",
)
