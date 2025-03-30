import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { WebSocketConfig } from '../utils/websocketConfig';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.currentUser = null;
        this.messageHandlers = new Map();
        this.chatEventHandlers = new Map();
    }

    connect(currentUser) {
        this.currentUser = currentUser;
        const socket = new SockJS(WebSocketConfig.WS_URL);
        this.stompClient = Stomp.over(socket);
        
        this.stompClient.connect({}, (frame) => {
            console.log('Connected to WebSocket:', frame);
            
            // Subscribe to user-specific messages
            this.stompClient.subscribe(
                WebSocketConfig.QUEUES.USER_MESSAGES(this.currentUser.id),
                (message) => {
                    const messageData = JSON.parse(message.body);
                    this.handleNewMessage(messageData);
                }
            );

            // Subscribe to chat events
            this.stompClient.subscribe(
                WebSocketConfig.QUEUES.USER_CHAT_EVENTS(this.currentUser.id),
                (event) => {
                    const eventData = JSON.parse(event.body);
                    this.handleChatEvent(eventData);
                }
            );

            // Subscribe to errors
            this.stompClient.subscribe(
                WebSocketConfig.QUEUES.USER_ERRORS(this.currentUser.id),
                (error) => {
                    console.error('WebSocket error:', error.body);
                }
            );
        });
    }

    disconnect() {
        if (this.stompClient) {
            this.stompClient.disconnect();
            this.stompClient = null;
        }
    }

    // Message handlers
    onNewMessage(handler) {
        this.messageHandlers.set('new', handler);
    }

    onMessageUpdate(handler) {
        this.messageHandlers.set('update', handler);
    }

    onMessageDelete(handler) {
        this.messageHandlers.set('delete', handler);
    }

    // Chat event handlers
    onNewChat(handler) {
        this.chatEventHandlers.set('new', handler);
    }

    onChatUpdate(handler) {
        this.chatEventHandlers.set('update', handler);
    }

    onUserStatusChange(handler) {
        this.chatEventHandlers.set('status', handler);
    }

    // Send methods
    sendMessage(chatId, content) {
        if (!this.stompClient) return;
        this.stompClient.send(WebSocketConfig.ENDPOINTS.SEND_MESSAGE, {}, JSON.stringify({
            chatId,
            content,
            messageType: 'TEXT'
        }));
    }

    updateMessage(chatId, messageId, content) {
        if (!this.stompClient) return;
        this.stompClient.send(WebSocketConfig.ENDPOINTS.UPDATE_MESSAGE, {}, JSON.stringify({
            chatId,
            messageId,
            content
        }));
    }

    deleteMessage(chatId, messageId) {
        if (!this.stompClient) return;
        this.stompClient.send(WebSocketConfig.ENDPOINTS.DELETE_MESSAGE, {}, JSON.stringify({
            chatId,
            messageId
        }));
    }

    sendTypingStatus(chatId, isTyping) {
        if (!this.stompClient) return;
        this.stompClient.send(
            WebSocketConfig.getTypingEndpoint(chatId),
            {},
            JSON.stringify(isTyping)
        );
    }

    // Event handlers
    handleNewMessage(messageData) {
        const handler = this.messageHandlers.get('new');
        if (handler) {
            handler(messageData);
        }
    }

    handleChatEvent(eventData) {
        switch (eventData.type) {
            case WebSocketConfig.EVENT_TYPES.NEW_MESSAGE:
                const newMessageHandler = this.messageHandlers.get('new');
                if (newMessageHandler) newMessageHandler(eventData.message);
                break;
            case WebSocketConfig.EVENT_TYPES.MESSAGE_UPDATED:
                const updateHandler = this.messageHandlers.get('update');
                if (updateHandler) updateHandler(eventData.message);
                break;
            case WebSocketConfig.EVENT_TYPES.MESSAGE_DELETED:
                const deleteHandler = this.messageHandlers.get('delete');
                if (deleteHandler) deleteHandler(eventData.messageId);
                break;
            case WebSocketConfig.EVENT_TYPES.NEW_CHAT:
                const newChatHandler = this.chatEventHandlers.get('new');
                if (newChatHandler) newChatHandler(eventData.chat);
                break;
            case WebSocketConfig.EVENT_TYPES.USER_STATUS_CHANGED:
                const statusHandler = this.chatEventHandlers.get('status');
                if (statusHandler) statusHandler(eventData.userId, eventData.status);
                break;
        }
    }
}

export const websocketService = new WebSocketService(); 