// API Base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.111:8082/api';
// export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8082/api';

// Auth URLs
export const AUTH_URLS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
};

// User URLs
export const USER_URLS = {
  PROFILE: `${API_BASE_URL}/users/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
  SEARCH: `${API_BASE_URL}/users/search`,
  GET_USER: (userId) => `${API_BASE_URL}/users/${userId}`,
  UPDATE_STATUS: `${API_BASE_URL}/users/status`,
};

// Chat URLs
export const CHAT_URLS = {
  GET_ALL: `${API_BASE_URL}/chats`,
  GET_CHAT: (chatId) => `${API_BASE_URL}/chats/${chatId}`,
  CREATE_PRIVATE: `${API_BASE_URL}/chats/private`,
  CREATE_GROUP: `${API_BASE_URL}/chats/group`,
  UPDATE_CHAT: (chatId) => `${API_BASE_URL}/chats/${chatId}`,
  DELETE_CHAT: (chatId) => `${API_BASE_URL}/chats/${chatId}`,
  LEAVE_CHAT: (chatId) => `${API_BASE_URL}/chats/${chatId}/leave`,
  ADD_PARTICIPANTS: (chatId) => `${API_BASE_URL}/chats/${chatId}/participants`,
  REMOVE_PARTICIPANT: (chatId, userId) => `${API_BASE_URL}/chats/${chatId}/participants/${userId}`,
  GET_MESSAGES: (chatId) => `${API_BASE_URL}/chats/${chatId}/messages`,
  SEND_MESSAGE: (chatId) => `${API_BASE_URL}/chats/${chatId}/messages`,
  DELETE_MESSAGE: (chatId, messageId) => `${API_BASE_URL}/chats/${chatId}/messages/${messageId}`,
  EDIT_MESSAGE: (chatId, messageId) => `${API_BASE_URL}/chats/${chatId}/messages/${messageId}`,
  MARK_AS_READ: (chatId) => `${API_BASE_URL}/chats/${chatId}/read`,
  ADD_REACTION: (chatId, messageId) => `${API_BASE_URL}/chats/${chatId}/messages/${messageId}/reactions`,
  REMOVE_REACTION: (chatId, messageId, reactionId) => `${API_BASE_URL}/chats/${chatId}/messages/${messageId}/reactions/${reactionId}`,
  EDIT_REACTION: (chatId, messageId, reactionId) => `${API_BASE_URL}/chats/${chatId}/messages/${messageId}/reactions/${reactionId}`,
};

// WebSocket URLs
export const WS_URLS = {
  // CONNECT: process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws',
  CONNECT: process.env.REACT_APP_WS_URL || 'ws://192.168.1.111:8082/ws',
  SUBSCRIBE: {
    USER_STATUS: (userId) => `/topic/user/${userId}/status`,
    CHAT_MESSAGES: (chatId) => `/topic/chat/${chatId}/messages`,
    CHAT_EVENTS: (userId) => `/topic/chat/${userId}/chat/events`,
    DELETED_MESSAGES: (chatId) => `/topic/chat/${chatId}/messages/delete`,
    MESSAGE_REACTIONS: (chatId) => `/topic/chat/${chatId}/messages/reactions`,
    REMOVED_REACTIONS: (chatId) => `/topic/chat/${chatId}/messages/reactions/removed`,
    MESSAGE_EDITS: (chatId) => `/topic/chat/${chatId}/messages/update`,
    CHAT_TOPIC: (chatId) => `/topic/chat/${chatId}`,
  },
  SEND: {
    TYPING: (chatId) => `/app/chat/${chatId}/typing`,
    MESSAGE: (chatId) => `/app/chat/${chatId}/message`,
    REACTION: (chatId, messageId) => `/app/chat/${chatId}/message/${messageId}/reaction`,
    REMOVE_REACTION: (chatId, messageId, reactionId) => `/app/chat/${chatId}/message/${messageId}/reaction/${reactionId}`,
    EDIT_REACTION: (chatId, messageId, reactionId) => `/app/chat/${chatId}/message/${messageId}/reaction/${reactionId}/edit`,
  },
};

// File URLs
export const FILE_URLS = {
  UPLOAD: `${API_BASE_URL}/files/upload`,
  GET_FILE: (fileId) => `${API_BASE_URL}/files/${fileId}`,
}; 