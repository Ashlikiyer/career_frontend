import React, { useState, useEffect } from "react";
import ITChatbot from "./ITChatbot";

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
            (msg: { type: string; timestamp: string }) =>
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
        <div
          className={`fixed z-50 ${
            position === "bottom-right"
              ? "bottom-4 right-4 sm:bottom-6 sm:right-6"
              : position === "bottom-left"
              ? "bottom-4 left-4 sm:bottom-6 sm:left-6"
              : position === "top-right"
              ? "top-4 right-4 sm:top-6 sm:right-6"
              : "top-4 left-4 sm:top-6 sm:left-6"
          }`}
        >
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
              className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 border-none rounded-full cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 relative overflow-hidden"
              onClick={handleOpen}
              aria-label="Open IT Career Assistant"
              title="Need help with your IT career? Click to chat!"
            >
              <span className="text-xl sm:text-2xl transition-all duration-300 hover:scale-125">
                🤖
              </span>
              <span className="text-base sm:text-lg transition-all duration-300 hover:translate-x-0.5">
                💬
              </span>
              {hasUnreadMessages && showUnreadIndicator && (
                <span
                  className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full text-xs animate-pulse"
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
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in ${
            theme === "dark" ? "bg-black/70" : ""
          }`}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chatbot-title"
        >
          <div
            className={`w-full sm:w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl h-[100vh] sm:h-auto sm:max-h-[85vh] sm:min-h-[500px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-slide-in ${
              isMinimized ? "max-h-12 overflow-hidden" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 sm:p-4 flex items-center justify-between relative border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full shadow-lg animate-pulse"
                  title="Chatbot is online"
                ></div>
                <h3
                  id="chatbot-title"
                  className="text-base sm:text-lg font-semibold"
                >
                  IT Career Assistant
                </h3>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  className="hidden sm:flex bg-white/20 hover:bg-white/30 text-white w-8 h-8 rounded-lg items-center justify-center text-sm transition-all duration-200 hover:scale-105"
                  onClick={isMinimized ? handleMaximize : handleMinimize}
                  aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
                  title={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? "⬆️" : "⬇️"}
                </button>
                <button
                  className="bg-white/20 hover:bg-white/40 text-white w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-xl sm:text-2xl font-bold transition-all duration-200 hover:scale-110 shadow-lg"
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
              <div className="flex-1 border-none rounded-none shadow-none max-w-none m-0 flex flex-col min-h-0">
                <ITChatbot />
              </div>
            )}

            {/* Minimized State */}
            {isMinimized && (
              <div className="p-3 text-center text-gray-600 text-sm bg-gray-50">
                <p>💬 Chat minimized - click ⬆️ to expand</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      {isOpen && (
        <div className="hidden sm:block fixed bottom-2.5 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm z-50 opacity-70 pointer-events-none">
          Press ESC to close chat
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
