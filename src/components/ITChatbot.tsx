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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error("Chatbot error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      const botErrorMessage = createBotMessage(errorMessage, "error");
      setMessages((prev) => [...prev, botErrorMessage]);
      setError(errorMessage);
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
    <div className="w-full h-full flex flex-col bg-white font-sans overflow-hidden">
      {/* Top Action Bar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 sm:p-3 flex items-center justify-between flex-shrink-0">
        <button
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={() => setShowHistory(!showHistory)}
        >
          <span>{showHistory ? "✕" : "📚"}</span>
          <span className="hidden sm:inline">
            {showHistory ? "Hide" : "History"}
          </span>
        </button>
        <button
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
          onClick={startNewChat}
        >
          <span>➕</span>
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-red-700 gap-2 flex-shrink-0">
          <span className="text-xs sm:text-sm">⚠️ {error}</span>
          <button
            onClick={retry}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs transition-colors duration-200 whitespace-nowrap"
          >
            {isLoading ? "🔄 Retrying..." : "🔄 Retry"}
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {showHistory && (
          <div className="w-48 sm:w-56 md:w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
            <div className="p-2 sm:p-4 border-b border-gray-200">
              <button
                className="w-full bg-white border border-gray-300 rounded-lg p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-200"
                onClick={startNewChat}
              >
                <span>➕</span>
                <span className="hidden sm:inline">New chat</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide px-1">
                Recent
              </div>
              {chatSessions.length === 0 ? (
                <div className="text-xs sm:text-sm text-gray-500 p-2 sm:p-4 text-center">
                  No previous chats
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session.session_uuid}
                    className="flex items-center p-1.5 sm:p-2 mb-1 bg-transparent hover:bg-gray-200 rounded-lg transition-colors duration-200 cursor-pointer group"
                    onClick={() => loadSession(session.session_uuid)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-normal text-gray-700 truncate">
                        {session.title}
                      </div>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 bg-none border-none text-xs cursor-pointer p-1 rounded transition-opacity duration-200 hover:bg-red-100 hover:text-red-600 ml-1 flex-shrink-0"
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

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-5 bg-gradient-to-b from-gray-50 to-gray-100 scroll-smooth">
            {messages.length === 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-3 sm:p-5 rounded-lg sm:rounded-xl mb-3 sm:mb-4 border-l-4 border-blue-500">
                <div className="text-2xl sm:text-3xl mb-2 text-center">👋</div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 text-center">
                  Hi! I'm your IT career assistant
                </h4>
                <p className="text-xs sm:text-sm text-gray-700 font-medium mb-2 sm:mb-3">
                  I can help you with:
                </p>
                <ul className="space-y-1.5 mb-2 sm:mb-3">
                  <li className="flex items-start gap-2 bg-white/60 p-2 rounded-lg text-[11px] sm:text-xs text-gray-700">
                    <span className="flex-shrink-0">🏢</span>
                    <span>Career information and guidance</span>
                  </li>
                  <li className="flex items-start gap-2 bg-white/60 p-2 rounded-lg text-[11px] sm:text-xs text-gray-700">
                    <span className="flex-shrink-0">🛠️</span>
                    <span>Technology skills and learning paths</span>
                  </li>
                  <li className="flex items-start gap-2 bg-white/60 p-2 rounded-lg text-[11px] sm:text-xs text-gray-700">
                    <span className="flex-shrink-0">💻</span>
                    <span>Programming and development questions</span>
                  </li>
                  <li className="flex items-start gap-2 bg-white/60 p-2 rounded-lg text-[11px] sm:text-xs text-gray-700">
                    <span className="flex-shrink-0">📈</span>
                    <span>Industry trends and opportunities</span>
                  </li>
                  <li className="flex items-start gap-2 bg-white/60 p-2 rounded-lg text-[11px] sm:text-xs text-gray-700">
                    <span className="flex-shrink-0">💰</span>
                    <span>Salary information and growth</span>
                  </li>
                </ul>
                <p className="text-[10px] sm:text-xs text-gray-600 text-center">
                  Try asking one of the suggested questions below!
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-3 sm:mb-4 md:mb-5 animate-fade-in ${
                  message.message_type === "user" ? "text-right" : ""
                }`}
              >
                <div
                  className={`inline-block max-w-[90%] sm:max-w-[85%] ${
                    message.message_type === "user"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl rounded-br-md shadow-lg"
                      : "bg-white text-gray-800 p-3 sm:p-4 rounded-2xl sm:rounded-3xl rounded-bl-md border border-gray-200 shadow-sm"
                  }`}
                >
                  {message.message_type === "bot" &&
                    message.response_type === "career_info" &&
                    message.career && (
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold mb-2 sm:mb-3 inline-block">
                        💼 {message.career}
                      </div>
                    )}
                  {message.message_type === "bot" &&
                    message.response_type === "scope_limitation" && (
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold mb-2 sm:mb-3 inline-block">
                        🎯 IT Career Focus
                      </div>
                    )}
                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed m-0">
                    {message.content}
                  </pre>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 font-medium">
                  {message.timestamp
                    ? message.timestamp.toLocaleTimeString()
                    : new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-3 sm:mb-5">
                <div className="inline-block bg-white text-gray-800 p-3 sm:p-4 rounded-2xl sm:rounded-3xl rounded-bl-md border border-gray-200 shadow-sm">
                  <div className="flex gap-1.5 p-2 sm:p-4">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></span>
                    <span
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 sm:p-4 md:p-5 bg-white border-t border-gray-200 flex-shrink-0">
            <form
              onSubmit={handleSubmit}
              className="flex gap-1.5 sm:gap-3 items-end"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about IT careers..."
                  disabled={isLoading}
                  maxLength={1000}
                  rows={1}
                  className="w-full p-2 sm:p-3 md:p-4 pr-10 sm:pr-14 md:pr-16 border-2 border-gray-200 rounded-lg sm:rounded-2xl text-xs sm:text-sm font-sans outline-none transition-all duration-300 bg-gray-50 focus:border-indigo-500 resize-none min-h-[2.5rem] sm:min-h-[3.5rem] max-h-[6rem] sm:max-h-[7.5rem]"
                />
                <div
                  className={`absolute bottom-1 sm:bottom-2 right-1.5 sm:right-3 text-[9px] sm:text-xs font-medium ${
                    inputValue.length > 900 ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {inputValue.length}/1000
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="w-9 h-9 sm:w-auto sm:h-auto sm:p-3 md:p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-none flex-shrink-0 flex items-center justify-center"
              >
                <span className="text-sm sm:text-base md:text-lg">
                  {isLoading ? "⏳" : "📤"}
                </span>
              </button>
            </form>
          </div>

          {messages.length === 0 && suggestions.length > 0 && (
            <div className="p-2 sm:p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200 flex-shrink-0 overflow-y-auto max-h-36 sm:max-h-56">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                💡 Suggested Questions:
              </h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                    className="px-2.5 sm:px-4 py-1 sm:py-1.5 bg-white border border-gray-200 rounded-full text-[11px] sm:text-sm cursor-pointer transition-all duration-200 text-gray-600 font-medium hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
