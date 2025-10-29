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
    <div className="max-w-4xl mx-auto border border-gray-200 rounded-2xl bg-white shadow-2xl overflow-hidden font-sans flex flex-col min-h-0">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 flex items-center justify-between relative border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            className="bg-white/20 hover:bg-white/30 rounded-lg p-2 text-white transition-all duration-200 flex items-center justify-center w-9 h-9"
            onClick={() => setShowHistory(!showHistory)}
            title={showHistory ? "Hide sidebar" : "Show chat history"}
          >
            {showHistory ? "✕" : "📚"}
          </button>
          <div className="header-content">
            <h3 className="text-lg font-semibold">IT Career Assistant</h3>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            className="bg-white/20 hover:bg-white/30 rounded-lg p-2 text-white transition-all duration-200"
            onClick={startNewChat}
            title="New chat"
          >
            ➕
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center justify-between text-red-700">
          <span className="text-sm">⚠️ {error}</span>
          <button
            onClick={retry}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
          >
            {isLoading ? "🔄 Retrying..." : "🔄 Retry"}
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {showHistory && (
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <button
                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-200"
                onClick={startNewChat}
              >
                <span>➕</span>
                New chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Recent
              </div>
              {chatSessions.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 text-center">
                  No previous chats
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session.session_uuid}
                    className="flex items-center p-2 mb-1 bg-transparent hover:bg-gray-200 rounded-lg transition-colors duration-200 cursor-pointer group"
                    onClick={() => loadSession(session.session_uuid)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-normal text-gray-700 truncate">
                        {session.title}
                      </div>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 bg-none border-none text-xs cursor-pointer p-1 rounded transition-opacity duration-200 hover:bg-red-100 hover:text-red-600 ml-2"
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

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-80 max-h-96 overflow-y-auto p-5 bg-gradient-to-b from-gray-50 to-gray-100 scroll-smooth">
            {messages.length === 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-7 rounded-xl mb-6 border-l-5 border-blue-500 text-center">
                <div className="text-4xl mb-3">👋</div>
                <h4 className="text-xl font-semibold text-gray-800 mb-4">
                  Hi! I'm your IT career assistant
                </h4>
                <p className="text-gray-700 font-medium mb-4">
                  I can help you with:
                </p>
                <ul className="text-left space-y-2 mb-4">
                  <li className="bg-white/60 p-2 rounded-lg text-gray-700 font-medium">
                    🏢 Career information and guidance
                  </li>
                  <li className="bg-white/60 p-2 rounded-lg text-gray-700 font-medium">
                    🛠️ Technology skills and learning paths
                  </li>
                  <li className="bg-white/60 p-2 rounded-lg text-gray-700 font-medium">
                    💻 Programming and development questions
                  </li>
                  <li className="bg-white/60 p-2 rounded-lg text-gray-700 font-medium">
                    📈 Industry trends and opportunities
                  </li>
                  <li className="bg-white/60 p-2 rounded-lg text-gray-700 font-medium">
                    💰 Salary information and growth prospects
                  </li>
                </ul>
                <p className="text-gray-600">
                  Try asking one of the suggested questions below!
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-5 animate-fade-in ${
                  message.message_type === "user" ? "text-right" : ""
                }`}
              >
                <div
                  className={`inline-block max-w-[85%] ${
                    message.message_type === "user"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-3xl rounded-br-md shadow-lg"
                      : "bg-white text-gray-800 p-4 rounded-3xl rounded-bl-md border border-gray-200 shadow-sm"
                  }`}
                >
                  {message.message_type === "bot" &&
                    message.response_type === "career_info" &&
                    message.career && (
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3 inline-block">
                        💼 Career Information: {message.career}
                      </div>
                    )}
                  {message.message_type === "bot" &&
                    message.response_type === "scope_limitation" && (
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3 inline-block">
                        🎯 IT Career Focus
                      </div>
                    )}
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed m-0">
                    {message.content}
                  </pre>
                </div>
                <div className="text-xs text-gray-500 mt-2 font-medium">
                  {message.timestamp
                    ? message.timestamp.toLocaleTimeString()
                    : new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-5">
                <div className="inline-block bg-white text-gray-800 p-4 rounded-3xl rounded-bl-md border border-gray-200 shadow-sm">
                  <div className="flex gap-1.5 p-4">
                    <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span
                      className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></span>
                    <span
                      className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-5 bg-white border-t border-gray-200">
            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about IT careers, programming, skills... (Press Shift+Enter for new line, Enter to send)"
                  disabled={isLoading}
                  maxLength={1000}
                  rows={1}
                  className="w-full p-4 pr-16 border-2 border-gray-200 rounded-2xl text-sm font-sans outline-none transition-all duration-300 bg-gray-50 focus:border-indigo-500 resize-none min-h-14 max-h-30"
                />
                <div
                  className={`absolute bottom-2 right-3 text-xs font-medium ${
                    inputValue.length > 900 ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {inputValue.length}/1000
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isLoading ? "⏳" : "📤"}
              </button>
            </form>
          </div>

          {messages.length === 0 && suggestions.length > 0 && (
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200">
              <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                💡 Suggested Questions:
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-full text-sm cursor-pointer transition-all duration-300 text-gray-600 font-medium hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:border-indigo-500 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
