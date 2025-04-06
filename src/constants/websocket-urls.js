// WebSocket URL configuration
export const WS_URLS = {
  // Base WebSocket URL - using http/https instead of ws/wss
  BASE_URL: 'http://localhost:8082/ws',
  
  // Subscription endpoints
  SUBSCRIBE: {
    USER_QUEUE: (userId) => `/user/${userId}/queue/messages`,
    CHAT_MESSAGES: (chatId) => `/topic/chat/${chatId}/messages`,
    CHAT_MESSAGES_DELETED: (chatId) => `/topic/chat/${chatId}/messages/deleted`,
    CHAT_MESSAGES_REACTIONS: (chatId) => `/topic/chat/${chatId}/messages/reactions`,
    CHAT_MESSAGES_REACTIONS_REMOVED: (chatId) => `/topic/chat/${chatId}/messages/reactions/removed`,
    CHAT_MESSAGES_READ: (chatId) => `/topic/chat/${chatId}/messages/read`,
    CHAT_MESSAGES_READ_ALL: (chatId) => `/topic/chat/${chatId}/messages/read/all`,
    CHAT_TYPING: (chatId) => `/topic/chat/${chatId}/typing`,
    CHAT_EVENTS: (userId) => `/user/${userId}/queue/chat.events`,
    USER_STATUS: '/topic/user.status',
    ERRORS: '/topic/errors',
    NOTIFICATIONS: (userId) => `/user/${userId}/queue/notifications`,
    CALL_SIGNALING: (chatId) => `/topic/chat/${chatId}/call`
  },

  // Publishing endpoints
  PUBLISH: {
    SEND_MESSAGE: '/app/message.send',
    EDIT_MESSAGE: '/app/message.edit',
    DELETE_MESSAGE: '/app/message.delete',
    ADD_REACTION: '/app/message.react',
    REMOVE_REACTION: '/app/message.reaction.remove',
    READ_MESSAGE: '/app/message.read',
    READ_ALL_MESSAGES: '/app/message.read.all',
    TYPING_INDICATOR: '/app/message.typing',
    USER_STATUS: '/app/chat.userStatus',
    ADD_USER: '/app/chat.addUser',
    CALL_SIGNAL: (chatId) => `/app/call/${chatId}/signal`
  },

  // Chat Events
  CHAT_EVENTS: (userId) => `/user/${userId}/queue/chat.events`,
  CHAT_TOPIC: (chatId) => `/topic/chat/${chatId}`,
  
  // Chat Operations
  CREATE_CHAT: '/app/chat.create',
  UPDATE_CHAT: '/app/chat.update',
  DELETE_CHAT: '/app/chat.delete',
  ADD_PARTICIPANT: '/app/chat.participants.add',
  REMOVE_PARTICIPANT: '/app/chat.participants.remove',
  LEAVE_CHAT: '/app/chat.leave'
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