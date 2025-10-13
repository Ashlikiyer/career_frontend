import React, { useState, useEffect } from "react";
import ITChatbot from "./ITChatbot";
import "./FloatingChatbot.css";

interface FloatingChatbotProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  theme?: "light" | "dark" | "auto";
  initiallyOpen?: boolean;
  showUnreadIndicator?: boolean;
  customTriggerButton?: React.ReactNode;
}

const FloatingChatbot: React.FC<FloatingChatbotProps> = ({
  position = "bottom-right",
  theme = "auto",
  initiallyOpen = false,
  showUnreadIndicator = true,
  customTriggerButton,
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check for unread messages in chat history
    const checkUnreadMessages = () => {
      const lastVisit = localStorage.getItem("chatbot-last-visit");
      const chatHistory = localStorage.getItem("chatbot-history");

      if (lastVisit && chatHistory) {
        try {
          const messages = JSON.parse(chatHistory);
          const lastVisitTime = new Date(lastVisit);
          const hasNewMessages = messages.some(
            (msg: any) =>
              msg.type === "bot" && new Date(msg.timestamp) > lastVisitTime
          );
          setHasUnreadMessages(hasNewMessages && !isOpen);
        } catch (error) {
          console.error("Error checking unread messages:", error);
        }
      }
    };

    if (showUnreadIndicator) {
      checkUnreadMessages();
      // Check periodically for new messages
      const interval = setInterval(checkUnreadMessages, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, showUnreadIndicator]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnreadMessages(false);
    // Mark visit time
    localStorage.setItem("chatbot-last-visit", new Date().toISOString());
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    // Mark visit time
    localStorage.setItem("chatbot-last-visit", new Date().toISOString());
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className={`floating-chatbot-trigger ${position}`}>
          {customTriggerButton ? (
            <div
              onClick={handleOpen}
              role="button"
              tabIndex={0}
              onKeyDown={handleKeyDown}
            >
              {customTriggerButton}
            </div>
          ) : (
            <button
              className="floating-chat-btn"
              onClick={handleOpen}
              aria-label="Open IT Career Assistant"
              title="Need help with your IT career? Click to chat!"
            >
              <span className="chat-icon">🤖</span>
              <span className="chat-text">💬</span>
              {hasUnreadMessages && showUnreadIndicator && (
                <span
                  className="unread-indicator"
                  aria-label="New messages available"
                >
                  •
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className={`chat-modal-overlay ${theme}`}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chatbot-title"
        >
          <div
            className={`chat-modal ${position} ${
              isMinimized ? "minimized" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Modal Header */}
            <div className="chat-modal-header">
              <div className="header-left">
                <div
                  className="status-indicator online"
                  title="Chatbot is online"
                ></div>
                <h3 id="chatbot-title">IT Career Assistant</h3>
              </div>
              <div className="header-actions">
                <button
                  className="minimize-btn"
                  onClick={isMinimized ? handleMaximize : handleMinimize}
                  aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
                  title={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? "⬆️" : "⬇️"}
                </button>
                <button
                  className="close-btn"
                  onClick={handleClose}
                  aria-label="Close chat"
                  title="Close chat"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chatbot Content */}
            {!isMinimized && (
              <div className="chat-modal-content">
                <ITChatbot />
              </div>
            )}

            {/* Minimized State */}
            {isMinimized && (
              <div className="minimized-content">
                <p>💬 Chat minimized - click ⬆️ to expand</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      {isOpen && (
        <div className="keyboard-hint" aria-live="polite">
          Press ESC to close chat
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
