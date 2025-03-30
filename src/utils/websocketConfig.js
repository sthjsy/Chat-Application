export const WebSocketConfig = {
    WS_URL: 'ws://localhost:8080/ws',
    ENDPOINTS: {
        SEND_MESSAGE: '/app/message.send',
        UPDATE_MESSAGE: '/app/message.update',
        DELETE_MESSAGE: '/app/message.delete',
        TYPING: '/app/typing'
    },
    QUEUES: {
        USER_MESSAGES: (userId) => `/user/${userId}/queue/messages`,
        USER_CHAT_EVENTS: (userId) => `/user/${userId}/queue/chat.events`,
        USER_ERRORS: (userId) => `/user/${userId}/queue/errors`
    },
    EVENT_TYPES: {
        NEW_MESSAGE: 'NEW_MESSAGE',
        MESSAGE_UPDATED: 'MESSAGE_UPDATED',
        MESSAGE_DELETED: 'MESSAGE_DELETED',
        NEW_CHAT: 'NEW_CHAT',
        USER_STATUS_CHANGED: 'USER_STATUS_CHANGED'
    },
    getTypingEndpoint: (chatId) => `/app/chat/${chatId}/typing`
}; 