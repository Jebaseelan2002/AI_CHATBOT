import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function createSessionId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem("chat_session_id") || createSessionId();
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const shortSessionId = useMemo(
    () => sessionId.slice(0, 8),
    [sessionId]
  );

  useEffect(() => {
    localStorage.setItem("chat_session_id", sessionId);
    loadHistory(sessionId);
  }, [sessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadHistory(id) {
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/history/${id}`);
      if (!response.ok) throw new Error("Could not load chat history");
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    }
  }

  function newChat() {
    setMessages([]);
    setInput("");
    setError("");
    setSessionId(createSessionId());
  }

  async function clearChat() {
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/history/${sessionId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not clear chat history");
      setMessages([]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendMessage(event) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError("");
    setLoading(true);
    setInput("");
    setMessages((current) => [
      ...current,
      { role: "user", content: text },
    ]);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Chat request failed");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer },
      ]);
    } catch (err) {
      setError(err.message);
      setMessages((current) => current.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(event);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">AI</div>
          <h1>Memory Chatbot</h1>
          <p className="muted">LangChain + Gemini + MongoDB</p>
        </div>

        <button className="new-chat" onClick={newChat}>
          + New chat
        </button>

        <div className="side-card">
          <span className="side-label">Current session</span>
          <code>{shortSessionId}</code>
          <small>
            Conversation history is stored in MongoDB for this session.
          </small>
        </div>

        <button className="danger-button" onClick={clearChat}>
          Clear current history
        </button>
      </aside>

      <main className="chat-area">
        <header className="topbar">
          <div>
            <h2>AI Assistant</h2>
            <p>Ask questions and continue the conversation naturally.</p>
          </div>
          <div className="status-dot"><span /> MongoDB memory</div>
        </header>

        <section className="messages">
          {messages.length === 0 && (
            <div className="welcome-card">
              <div className="welcome-icon">✦</div>
              <h3>Start a conversation</h3>
              <p>
                Try: “I want to learn AI” and then ask “Give me a learning plan.”
                The second message can use the first message as context.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`message-row ${message.role}`}>
              <div className="avatar">{message.role === "user" ? "You" : "AI"}</div>
              <div className="message-bubble">{message.content}</div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant">
              <div className="avatar">AI</div>
              <div className="message-bubble typing">Thinking...</div>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}
          <div ref={endRef} />
        </section>

        <form className="composer" onSubmit={sendMessage}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your AI assistant..."
            rows="1"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? "..." : "Send"}
          </button>
        </form>
      </main>
    </div>
  );
}
