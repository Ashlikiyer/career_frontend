// Chatbot Service - Handles all API communication with the IT Career Chatbot backend

export interface ChatbotMessage {
  id?: number;
  message_type: 'user' | 'bot';
  content: string;
  response_type?: 'career_info' | 'ai_response' | 'scope_limitation' | 'error';
  career?: string;
  created_at: string;
  metadata?: any;
  timestamp?: Date; // Keep for backward compatibility
}

export interface ChatSession {
  id: number;
  session_uuid: string;
  title: string;
  created_at: string;
  last_active: string;
  message_count: number;
}

export interface ChatbotResponse {
  success: boolean;
  response: string | any; // Can be string or object for career_info
  response_type: 'career_info' | 'ai_response' | 'scope_limitation';
  career?: string | null;
  session_uuid?: string;
  metadata?: {
    model?: string;
    processing_time?: number;
    tokens_used?: number;
    message_saved?: boolean;
  };
}

export interface SuggestionsResponse {
  suggestions: string[];
  categories: string[];
}

export interface SessionsResponse {
  success: boolean;
  sessions: ChatSession[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface MessagesResponse {
  success: boolean;
  session: ChatSession;
  messages: ChatbotMessage[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface ChatbotError {
  message: string;
  status?: number;
  type: 'network' | 'server' | 'unknown';
}

class ChatbotService {
  private apiBaseUrl: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token') || this.getCookieToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private getCookieToken(): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'authToken') {
          return value;
        }
      }
    } catch (error) {
      console.warn('Failed to get token from cookies:', error);
    }
    return null;
  }

  /**
   * Get suggested questions from the chatbot
   */
  async getSuggestions(): Promise<SuggestionsResponse> {
    try {
      const response = await this.fetchWithRetry(`${this.apiBaseUrl}/api/chatbot/suggestions`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw this.createError(response);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send a message to the chatbot (new backend API)
   */
  async sendMessage(message: string, sessionUuid?: string): Promise<ChatbotResponse> {
    try {
      const requestBody = {
        message: message.trim(),
        ...(sessionUuid && { session_uuid: sessionUuid })
      };

      const response = await this.fetchWithRetry(`${this.apiBaseUrl}/api/chatbot/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw this.createError(response);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user's chat sessions
   */
  async getSessions(limit: number = 20, offset: number = 0): Promise<SessionsResponse> {
    try {
      const url = `${this.apiBaseUrl}/api/chatbot/sessions?limit=${limit}&offset=${offset}`;
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw this.createError(response);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new chat session
   */
  async createSession(title?: string): Promise<{ success: boolean; session: ChatSession }> {
    try {
      const response = await this.fetchWithRetry(`${this.apiBaseUrl}/api/chatbot/sessions`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ title })
      });

      if (!response.ok) {
        throw this.createError(response);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get messages from a specific session
   */
  async getSessionMessages(sessionUuid: string, limit: number = 50, offset: number = 0): Promise<MessagesResponse> {
    try {
      const url = `${this.apiBaseUrl}/api/chatbot/sessions/${sessionUuid}/messages?limit=${limit}&offset=${offset}`;
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw this.createError(response);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update session title
   */
  async updateSessionTitle(sessionUuid: string, title: string): Promise<{ success: boolean; session: ChatSession }> {
    try {
      const response = await this.fetchWithRetry(`${this.apiBaseUrl}/api/chatbot/sessions/${sessionUuid}`, {
        method: 'PUT',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ title })
      });

      if (!response.ok) {
        throw this.createError(response);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a chat session
   */
  async deleteSession(sessionUuid: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.fetchWithRetry(`${this.apiBaseUrl}/api/chatbot/sessions/${sessionUuid}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw this.createError(response);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async askQuestion(question: string): Promise<ChatbotResponse> {
    return this.sendMessage(question);
  }

  /**
   * Fetch with retry logic for better reliability
   */
  private async fetchWithRetry(url: string, options: RequestInit, attempt: number = 1): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Create a standardized error object
   */
  private createError(response: Response): ChatbotError {
    const status = response.status;
    let message: string;
    let type: 'network' | 'server' | 'unknown' = 'unknown';

    switch (status) {
      case 400:
        message = 'Invalid request. Please check your question and try again.';
        type = 'server';
        break;
      case 401:
        message = 'Authentication required. Please log in and try again.';
        type = 'server';
        break;
      case 403:
        message = 'Access denied. You don\'t have permission to use this feature.';
        type = 'server';
        break;
      case 404:
        message = 'Chatbot service not found. Please contact support.';
        type = 'server';
        break;
      case 429:
        message = 'Too many requests. Please wait a moment before trying again.';
        type = 'server';
        break;
      case 500:
        message = 'The chatbot service is temporarily unavailable. Please try again later.';
        type = 'server';
        break;
      case 502:
      case 503:
      case 504:
        message = 'Service temporarily unavailable. Please try again in a few minutes.';
        type = 'server';
        break;
      default:
        message = `Unexpected error (${status}). Please try again.`;
        type = 'unknown';
    }

    return { message, status, type };
  }

  /**
   * Handle and standardize errors
   */
  private handleError(error: any): ChatbotError {
    if (error.message && error.status) {
      // Already a ChatbotError
      return error;
    }

    if (error.name === 'AbortError') {
      return {
        message: 'Request timed out. Please check your connection and try again.',
        type: 'network'
      };
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        message: 'Unable to connect to the chatbot service. Please check your internet connection.',
        type: 'network'
      };
    }

    return {
      message: 'An unexpected error occurred. Please try again.',
      type: 'unknown'
    };
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: any): boolean {
    if (error.name === 'AbortError') {
      return false; // Don't retry timeouts
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true; // Retry network errors
    }

    if (error.status >= 500) {
      return true; // Retry server errors
    }

    return false;
  }

  /**
   * Simple delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection to the chatbot service
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/chatbot/suggestions`, {
        method: 'HEAD',
        credentials: 'include',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get analytics data for chatbot usage (if available)
   */
  async getAnalytics(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    try {
      const response = await this.fetchWithRetry(`${this.apiBaseUrl}/api/chatbot/analytics?timeframe=${timeframe}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw this.createError(response);
      }

      return await response.json();
    } catch (error) {
      // Analytics is optional, so we don't throw errors
      console.warn('Analytics not available:', error);
      return null;
    }
  }
}

// Create a singleton instance
export const chatbotService = new ChatbotService();

// Message creation utilities  
export const createUserMessage = (content: string): ChatbotMessage => ({
  message_type: 'user',
  content,
  created_at: new Date().toISOString(),
  timestamp: new Date() // Keep for backward compatibility
});

export const createBotMessage = (
  content: string, 
  responseType: 'career_info' | 'ai_response' | 'scope_limitation' | 'error' = 'ai_response',
  career?: string
): ChatbotMessage => ({
  message_type: 'bot',
  content,
  response_type: responseType,
  career,
  created_at: new Date().toISOString(),
  timestamp: new Date() // Keep for backward compatibility
});

// Backend-integrated session management
export const loadChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await chatbotService.getSessions();
    return response.sessions || [];
  } catch (error) {
    console.warn('Failed to load chat sessions:', error);
    return [];
  }
};

export const loadChatSession = async (sessionUuid: string): Promise<ChatbotMessage[]> => {
  try {
    const response = await chatbotService.getSessionMessages(sessionUuid);
    return response.messages || [];
  } catch (error) {
    console.warn('Failed to load chat session:', error);
    return [];
  }
};

export const createNewChatSession = async (title?: string): Promise<ChatSession | null> => {
  try {
    const response = await chatbotService.createSession(title);
    return response.session;
  } catch (error) {
    console.warn('Failed to create chat session:', error);
    return null;
  }
};

export const updateChatSessionTitle = async (sessionUuid: string, title: string): Promise<boolean> => {
  try {
    await chatbotService.updateSessionTitle(sessionUuid, title);
    return true;
  } catch (error) {
    console.warn('Failed to update session title:', error);
    return false;
  }
};

export const deleteChatSession = async (sessionUuid: string): Promise<boolean> => {
  try {
    await chatbotService.deleteSession(sessionUuid);
    return true;
  } catch (error) {
    console.warn('Failed to delete chat session:', error);
    return false;
  }
};

// Legacy functions for backward compatibility (now use localStorage for current session only)
export const saveChatHistory = (messages: ChatbotMessage[]): void => {
  // This now only saves locally for the current session
  // Backend saves automatically when messages are sent
  try {
    localStorage.setItem('current-chat-messages', JSON.stringify(messages));
  } catch (error) {
    console.warn('Failed to save current chat messages:', error);
  }
};

export const loadChatHistory = (): ChatbotMessage[] => {
  // Load current session messages from localStorage
  try {
    const saved = localStorage.getItem('current-chat-messages');
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(msg.created_at)
      })) : [];
    }
  } catch (error) {
    console.warn('Failed to load current chat messages:', error);
  }
  return [];
};

export const clearChatHistory = (): void => {
  // Clear current local session
  try {
    localStorage.removeItem('current-chat-messages');
    localStorage.removeItem('current-session-uuid');
  } catch (error) {
    console.warn('Failed to clear current chat:', error);
  }
};

export const getCurrentSessionUuid = (): string | null => {
  return localStorage.getItem('current-session-uuid');
};

export const setCurrentSessionUuid = (sessionUuid: string): void => {
  localStorage.setItem('current-session-uuid', sessionUuid);
};

export const clearCurrentSession = (): void => {
  localStorage.removeItem('current-session-uuid');
  localStorage.removeItem('current-chat-messages');
};

// Analytics tracking
export const trackChatbotEvent = (eventType: string, data: any = {}): void => {
  // Google Analytics 4
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'chatbot_interaction', {
      event_category: 'chatbot',
      event_label: eventType,
      custom_parameter_1: data.question?.substring(0, 50),
      custom_parameter_2: data.responseType,
      custom_parameter_3: data.career
    });
  }

  // Adobe Analytics
  if (typeof (window as any).s !== 'undefined') {
    const s = (window as any).s;
    s.linkTrackVars = 'prop1,prop2,eVar1,eVar2,events';
    s.linkTrackEvents = 'event1';
    s.prop1 = eventType;
    s.prop2 = data.responseType;
    s.eVar1 = data.question?.substring(0, 100);
    s.eVar2 = data.career;
    s.events = 'event1';
    s.tl(true, 'o', 'Chatbot Interaction');
  }

  // Custom analytics
  if ((window as any).analytics) {
    (window as any).analytics.track('Chatbot Interaction', {
      type: eventType,
      question: data.question,
      responseType: data.responseType,
      career: data.career,
      timestamp: new Date().toISOString()
    });
  }

  // Mixpanel
  if (typeof (window as any).mixpanel !== 'undefined') {
    (window as any).mixpanel.track('Chatbot Interaction', {
      event_type: eventType,
      question_preview: data.question?.substring(0, 50),
      response_type: data.responseType,
      career: data.career
    });
  }
};

export default chatbotService;