/**
 * WebSocket URL configuration for frontend integration.
 * This file serves as a single source of truth for all WebSocket endpoints.
 */

export const WebSocketUrls = {
    // Base WebSocket endpoint
    WS_BASE_URL: '/ws',

    // Message endpoints
    MESSAGE_SEND: '/app/chat.sendMessage',
    MESSAGE_RECEIVE: '/topic/chat/',

    // User status endpoints
    USER_CONNECT: '/app/chat.addUser',
    USER_STATUS_UPDATE: '/app/chat.userStatus',

    // Typing indicator endpoints
    TYPING_SEND: '/app/chat/',
    TYPING_RECEIVE: '/topic/chat/',
    TYPING_SUFFIX: '/typing',

    // Call signaling endpoints
    CALL_SIGNAL_SEND: '/app/call/',
    CALL_SIGNAL_RECEIVE: '/topic/chat/',
    CALL_SIGNAL_SUFFIX: '/call',

    // Error handling endpoint
    ERROR_RECEIVE: '/user/queue/errors',

    /**
     * Gets the complete message receive URL for a specific chat
     * @param chatId The ID of the chat
     * @returns The complete message receive URL
     */
    getMessageReceiveUrl(chatId: number): string {
        return this.MESSAGE_RECEIVE + chatId;
    },

    /**
     * Gets the complete typing indicator send URL for a specific chat
     * @param chatId The ID of the chat
     * @returns The complete typing indicator send URL
     */
    getTypingSendUrl(chatId: number): string {
        return this.TYPING_SEND + chatId + this.TYPING_SUFFIX;
    },

    /**
     * Gets the complete typing indicator receive URL for a specific chat
     * @param chatId The ID of the chat
     * @returns The complete typing indicator receive URL
     */
    getTypingReceiveUrl(chatId: number): string {
        return this.TYPING_RECEIVE + chatId + this.TYPING_SUFFIX;
    },

    /**
     * Gets the complete call signal send URL for a specific chat
     * @param chatId The ID of the chat
     * @returns The complete call signal send URL
     */
    getCallSignalSendUrl(chatId: number): string {
        return this.CALL_SIGNAL_SEND + chatId + this.CALL_SIGNAL_SUFFIX;
    },

    /**
     * Gets the complete call signal receive URL for a specific chat
     * @param chatId The ID of the chat
     * @returns The complete call signal receive URL
     */
    getCallSignalReceiveUrl(chatId: number): string {
        return this.CALL_SIGNAL_RECEIVE + chatId + this.CALL_SIGNAL_SUFFIX;
    }
};

// Example usage in frontend:
/*
import { WebSocketUrls } from './websocket-urls';

// Connect to WebSocket
const socket = new SockJS(WebSocketUrls.WS_BASE_URL);
const stompClient = Stomp.over(socket);

// Connect and subscribe to channels
stompClient.connect({}, frame => {
    // Subscribe to personal error channel
    stompClient.subscribe(WebSocketUrls.ERROR_RECEIVE, error => {
        console.error('Received error:', error.body);
    });

    // Notify server about connection
    stompClient.send(WebSocketUrls.USER_CONNECT, {});

    // Subscribe to specific chat
    const chatId = 123; // Your chat ID
    stompClient.subscribe(WebSocketUrls.getMessageReceiveUrl(chatId), message => {
        // Handle incoming messages
    });

    // Subscribe to typing indicators
    stompClient.subscribe(WebSocketUrls.getTypingReceiveUrl(chatId), typing => {
        // Handle typing status
    });

    // Subscribe to call signals
    stompClient.subscribe(WebSocketUrls.getCallSignalReceiveUrl(chatId), signal => {
        // Handle call signals
    });
});

// Sending messages
function sendMessage(chatId: number, content: string) {
    stompClient.send(WebSocketUrls.MESSAGE_SEND, {}, JSON.stringify({
        chatId: chatId,
        content: content,
        messageType: 'TEXT'
    }));
}

// Sending typing status
function sendTypingStatus(chatId: number, isTyping: boolean) {
    stompClient.send(WebSocketUrls.getTypingSendUrl(chatId), {}, JSON.stringify(isTyping));
}

// Sending call signals
function sendCallSignal(chatId: number, signal: any) {
    stompClient.send(WebSocketUrls.getCallSignalSendUrl(chatId), {}, JSON.stringify(signal));
}
*/ 