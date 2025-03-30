// WebSocket URL configuration
export const WS_URLS = {
  // Base WebSocket URL - using http/https instead of ws/wss
  BASE_URL: 'http://localhost:8082/ws',
  
  // Subscription endpoints
  SUBSCRIBE: {
    USER_QUEUE: (userId) => `/user/${userId}/queue/messages`,
    CHAT_MESSAGES: (chatId) => `/topic/chat/${chatId}`,
    CHAT_TYPING: (chatId) => `/topic/chat/${chatId}/typing`,
    CHAT_EVENTS: (userId) => `/user/${userId}/queue/chat.events`,
    USER_STATUS: '/topic/user.status',
    ERRORS: (userId) => `/user/${userId}/queue/errors`,
    NOTIFICATIONS: (userId) => `/user/${userId}/queue/notifications`,
    CALL_SIGNALING: (chatId) => `/topic/chat/${chatId}/call`
  },

  // Publishing endpoints
  PUBLISH: {
    SEND_MESSAGE: '/app/chat.sendMessage',
    TYPING_INDICATOR: (chatId) => `/app/chat/${chatId}/typing`,
    USER_STATUS: '/app/chat.userStatus',
    MARK_READ: '/app/chat.read',
    ADD_USER: '/app/chat.addUser',
    CALL_SIGNAL: (chatId) => `/app/call/${chatId}/signal`
  }
};

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  CHAT: 'CHAT',
  TYPING: 'TYPING',
  STATUS: 'STATUS',
  CALL: 'CALL',
  ERROR: 'ERROR',
  NOTIFICATION: 'NOTIFICATION'
}; 