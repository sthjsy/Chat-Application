export const WebSocketConfig = {
    // Base WebSocket URL
    WS_URL: 'ws://192.168.1.111:8082/ws',
    // WS_URL: 'ws://localhost:8082/ws',

    // WebSocket Endpoints
    ENDPOINTS: {
        // Chat Message Endpoints
        SEND_MESSAGE: '/app/chat.sendMessage',
        UPDATE_MESSAGE: '/app/chat.updateMessage',
        DELETE_MESSAGE: '/app/chat.deleteMessage',
        NEW_CHAT: '/app/chat.newChat',
        
        // User Status Endpoints
        ADD_USER: '/app/chat.addUser',
        UPDATE_USER_STATUS: '/app/chat.userStatus',
        
        // Typing Indicator
        TYPING: '/app/chat/{chatId}/typing',
        
        // Call Signaling
        CALL_SIGNAL: '/app/call/{chatId}/signal'
    },

    // Subscription Topics
    TOPICS: {
        // Chat Topics
        CHAT_MESSAGES: '/topic/chat/{chatId}',
        CHAT_TYPING: '/topic/chat/{chatId}/typing',
        CHAT_CALL: '/topic/chat/{chatId}/call',
        
        // User-specific Topics
        USER_MESSAGES: '/user/{userId}/queue/messages',
        USER_CHAT_EVENTS: '/user/{userId}/queue/chat.events',
        USER_ERRORS: '/user/{userId}/queue/errors'
    },

    // Event Types
    EVENT_TYPES: {
        NEW_MESSAGE: 'NEW_MESSAGE',
        MESSAGE_UPDATED: 'MESSAGE_UPDATED',
        MESSAGE_DELETED: 'MESSAGE_DELETED',
        NEW_CHAT: 'NEW_CHAT',
        USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
        TYPING_STARTED: 'TYPING_STARTED',
        TYPING_STOPPED: 'TYPING_STOPPED'
    },

    // Helper function to get user-specific message queue
    getUserMessageQueue: (userId) => {
        return WebSocketConfig.TOPICS.USER_MESSAGES.replace('{userId}', userId.toString());
    },

    // Helper function to get user-specific chat events queue
    getUserChatEventsQueue: (userId) => {
        return WebSocketConfig.TOPICS.USER_CHAT_EVENTS.replace('{userId}', userId.toString());
    },

    // Helper function to get user-specific errors queue
    getUserErrorsQueue: (userId) => {
        return WebSocketConfig.TOPICS.USER_ERRORS.replace('{userId}', userId.toString());
    },

    // Helper function to get chat topic
    getChatTopic: (chatId) => {
        return WebSocketConfig.TOPICS.CHAT_MESSAGES.replace('{chatId}', chatId.toString());
    },

    // Helper function to get chat typing topic
    getChatTypingTopic: (chatId) => {
        return WebSocketConfig.TOPICS.CHAT_TYPING.replace('{chatId}', chatId.toString());
    },

    // Helper function to get chat call topic
    getChatCallTopic: (chatId) => {
        return WebSocketConfig.TOPICS.CHAT_CALL.replace('{chatId}', chatId.toString());
    },

    // Helper function to get typing endpoint
    getTypingEndpoint: (chatId) => {
        return WebSocketConfig.ENDPOINTS.TYPING.replace('{chatId}', chatId.toString());
    },

    // Helper function to get call signal endpoint
    getCallSignalEndpoint: (chatId) => {
        return WebSocketConfig.ENDPOINTS.CALL_SIGNAL.replace('{chatId}', chatId.toString());
    }
}; 