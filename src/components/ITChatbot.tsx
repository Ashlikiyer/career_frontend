import React, { useState, useEffect, useRef } from "react";
import {
  chatbotService,
  createUserMessage,
  createBotMessage,
  trackChatbotEvent,
  loadChatSessions,
  loadChatSession,
  createNewChatSession,
  deleteChatSession,
  type ChatbotMessage,
  type ChatSession,
} from "../services/chatbotService";
import "./ITChatbot.css";

const ITChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionUuid, setCurrentSessionUuid] = useState<string | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSuggestions();

    // Load chat sessions from backend
    loadChatSessionsList();

    // Clear old localStorage data to prevent conflicts
    clearOldChatData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSuggestions = async () => {
    try {
      const data = await chatbotService.getSuggestions();
      setSuggestions(data.suggestions);
    } catch (error: any) {
      console.error("Failed to load suggestions:", error);
      setError("Unable to load question suggestions");
    }
  };

  const clearOldChatData = () => {
    try {
      // Clear old localStorage chat data to prevent user mixing
      localStorage.removeItem("chatHistory");
      localStorage.removeItem("currentSessionUuid");
      console.log("Cleared old localStorage chat data");
    } catch (error) {
      console.warn("Could not clear localStorage:", error);
    }
  };

  const loadChatSessionsList = async () => {
    try {
      const sessions = await loadChatSessions();
      setChatSessions(sessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      setError("Failed to load chat history");
    }
  };

  const loadSession = async (sessionUuid: string) => {
    try {
      setIsLoading(true);
      const sessionMessages = await loadChatSession(sessionUuid);
      setMessages(sessionMessages);
      setCurrentSessionUuid(sessionUuid);
      setShowHistory(false);
      setError(null);
    } catch (error) {
      console.error("Failed to load session:", error);
      setError("Failed to load chat session");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionUuid: string) => {
    try {
      const success = await deleteChatSession(sessionUuid);
      if (success) {
        // If current session was deleted, clear it
        if (currentSessionUuid === sessionUuid) {
          setCurrentSessionUuid(null);
          setMessages([]);
        }
        await loadChatSessionsList();
      } else {
        setError("Failed to delete session");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      setError("Failed to delete session");
    }
  };

  const startNewChat = async () => {
    try {
      // Create new session on backend
      const newSession = await createNewChatSession();
      if (newSession) {
        setCurrentSessionUuid(newSession.session_uuid);
      } else {
        // Fallback: clear current session
        setCurrentSessionUuid(null);
      }

      setMessages([]);
      setError(null);
      setShowHistory(false);
      await loadChatSessionsList(); // Refresh sessions list
    } catch (error) {
      console.error("Failed to create new chat:", error);
      // Fallback to local clear
      setCurrentSessionUuid(null);
      setMessages([]);
      setError(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        sendMessage(inputValue);
      }
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120); // Max 120px height
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const getCharCounterClass = () => {
    if (inputValue.length > 900) return "char-counter warning";
    return "char-counter";
  };

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;

    // Add user message using service utility
    const userMessage = createUserMessage(question);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    // Track question asked
    trackChatbotEvent("question_asked", { question });

    try {
      // Send message to backend with current session UUID
      const data = await chatbotService.sendMessage(
        question,
        currentSessionUuid || undefined
      );

      // Handle response content - can be string or object for career_info
      let responseContent = data.response;
      if (
        typeof data.response === "object" &&
        data.response_type === "career_info"
      ) {
        // Format career info response
        const careerInfo = data.response;
        responseContent = `**${careerInfo.career_name}**\n\n${
          careerInfo.description
        }\n\n**Average Salary:** ${
          careerInfo.average_salary
        }\n**Skills Required:** ${careerInfo.skills_required?.join(
          ", "
        )}\n**Education:** ${
          careerInfo.education_requirements
        }\n**Job Outlook:** ${careerInfo.job_outlook}`;
      }

      // Add bot response using service utility
      const botMessage = createBotMessage(
        responseContent,
        data.response_type,
        data.career || undefined
      );
      setMessages((prev) => [...prev, botMessage]);

      // Update session UUID if a new session was created
      if (data.session_uuid && !currentSessionUuid) {
        setCurrentSessionUuid(data.session_uuid);
        await loadChatSessionsList(); // Refresh sessions list
      }

      // Track response received
      trackChatbotEvent("response_received", {
        question,
        responseType: data.response_type,
        career: data.career,
      });
    } catch (error: any) {
      console.error("Chatbot error:", error);
      const errorMessage = createBotMessage(error.message, "error");
      setMessages((prev) => [...prev, errorMessage]);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    trackChatbotEvent("suggestion_clicked", { suggestion });
    sendMessage(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
    }
  };

  const retry = () => {
    setError(null);
    if (messages.length > 0) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((msg) => msg.message_type === "user");
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content);
      }
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-header">
        <div className="header-left">
          <button
            className="history-toggle-btn"
            onClick={() => setShowHistory(!showHistory)}
            title={showHistory ? "Hide sidebar" : "Show chat history"}
          >
            {showHistory ? "✕" : "📚"}
          </button>
          <div className="header-content">
            <h3>IT Career Assistant</h3>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="new-chat-btn"
            onClick={startNewChat}
            title="New chat"
          >
            ➕
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={retry} disabled={isLoading}>
            {isLoading ? "🔄 Retrying..." : "🔄 Retry"}
          </button>
        </div>
      )}

      <div className="chat-layout">
        {showHistory && (
          <div className="chat-sidebar">
            <div className="sidebar-header">
              <button className="new-chat-sidebar-btn" onClick={startNewChat}>
                <span className="new-chat-icon">➕</span>
                New chat
              </button>
            </div>
            <div className="history-list">
              <div className="history-section-title">Recent</div>
              {chatSessions.length === 0 ? (
                <div className="no-history">No previous chats</div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session.session_uuid}
                    className="history-item"
                    onClick={() => loadSession(session.session_uuid)}
                  >
                    <div className="session-info">
                      <div className="session-title">{session.title}</div>
                    </div>
                    <button
                      className="delete-session-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.session_uuid);
                      }}
                      title="Delete chat"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="chat-main">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="welcome-icon">👋</div>
                <h4>Hi! I'm your IT career assistant</h4>
                <p>I can help you with:</p>
                <ul>
                  <li>🏢 Career information and guidance</li>
                  <li>🛠️ Technology skills and learning paths</li>
                  <li>💻 Programming and development questions</li>
                  <li>📈 Industry trends and opportunities</li>
                  <li>💰 Salary information and growth prospects</li>
                </ul>
                <p>Try asking one of the suggested questions below!</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.message_type}-message`}
              >
                <div className="message-content">
                  {message.message_type === "bot" &&
                    message.response_type === "career_info" &&
                    message.career && (
                      <div className="career-info-badge">
                        💼 Career Information: {message.career}
                      </div>
                    )}
                  {message.message_type === "bot" &&
                    message.response_type === "scope_limitation" && (
                      <div className="scope-limitation-badge">
                        🎯 IT Career Focus
                      </div>
                    )}
                  <pre className="message-text">{message.content}</pre>
                </div>
                <div className="message-time">
                  {message.timestamp
                    ? message.timestamp.toLocaleTimeString()
                    : new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message bot-message loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <form onSubmit={handleSubmit}>
              <div className="input-container">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about IT careers, programming, skills... (Press Shift+Enter for new line, Enter to send)"
                  disabled={isLoading}
                  maxLength={1000}
                  rows={1}
                />
                <div className={getCharCounterClass()}>
                  {inputValue.length}/1000
                </div>
              </div>
              <button type="submit" disabled={isLoading || !inputValue.trim()}>
                {isLoading ? "⏳" : "📤"}
              </button>
            </form>
          </div>

          {messages.length === 0 && suggestions.length > 0 && (
            <div className="suggestions">
              <h4>💡 Suggested Questions:</h4>
              <div className="suggestion-buttons">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="suggestion-btn"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ITChatbot;
