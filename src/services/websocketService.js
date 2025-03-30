import { WebSocketConfig } from '../utils/websocketConfig';
import { Client } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.client = null;
        this.subscriptions = new Map();
        this.messageHandlers = new Map();
        this.connected = false;
    }

    connect(userId) {
        if (this.connected) return;

        this.client = new Client({
            brokerURL: WebSocketConfig.WS_URL,
            connectHeaders: {
                'userId': userId
            },
            debug: (str) => {
                console.log('STOMP Debug:', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        this.client.onConnect = () => {
            console.log('Connected to WebSocket');
            this.connected = true;
            this.subscribeToUserTopics(userId);
        };

        this.client.onStompError = (frame) => {
            console.error('STOMP Error:', frame);
            this.connected = false;
        };

        this.client.onWebSocketClose = () => {
            console.log('WebSocket connection closed');
            this.connected = false;
        };

        this.client.activate();
    }

    subscribeToUserTopics(userId) {
        // Subscribe to user-specific message queue
        const messageQueue = WebSocketConfig.getUserMessageQueue(userId);
        this.subscribe(messageQueue, (message) => {
            const event = JSON.parse(message.body);
            this.handleMessageEvent(event);
        });

        // Subscribe to user-specific chat events queue
        const chatEventsQueue = WebSocketConfig.getUserChatEventsQueue(userId);
        this.subscribe(chatEventsQueue, (message) => {
            const event = JSON.parse(message.body);
            this.handleChatEvent(event);
        });

        // Subscribe to user-specific errors queue
        const errorsQueue = WebSocketConfig.getUserErrorsQueue(userId);
        this.subscribe(errorsQueue, (message) => {
            console.error('WebSocket Error:', message.body);
        });
    }

    subscribeToChat(chatId) {
        const chatTopic = WebSocketConfig.getChatTopic(chatId);
        this.subscribe(chatTopic, (message) => {
            const event = JSON.parse(message.body);
            this.handleMessageEvent(event);
        });

        const typingTopic = WebSocketConfig.getChatTypingTopic(chatId);
        this.subscribe(typingTopic, (message) => {
            const event = JSON.parse(message.body);
            this.handleTypingEvent(event);
        });
    }

    subscribe(destination, callback) {
        if (!this.connected) return;

        const subscription = this.client.subscribe(destination, callback);
        this.subscriptions.set(destination, subscription);
    }

    unsubscribe(destination) {
        const subscription = this.subscriptions.get(destination);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(destination);
        }
    }

    handleMessageEvent(event) {
        const { type, data } = event;
        switch (type) {
            case WebSocketConfig.EVENT_TYPES.NEW_MESSAGE:
                this.notifyHandlers('newMessage', data);
                break;
            case WebSocketConfig.EVENT_TYPES.MESSAGE_UPDATED:
                this.notifyHandlers('messageUpdated', data);
                break;
            case WebSocketConfig.EVENT_TYPES.MESSAGE_DELETED:
                this.notifyHandlers('messageDeleted', data);
                break;
        }
    }

    handleChatEvent(event) {
        const { type, data } = event;
        switch (type) {
            case WebSocketConfig.EVENT_TYPES.NEW_CHAT:
                this.notifyHandlers('newChat', data);
                break;
            case WebSocketConfig.EVENT_TYPES.USER_STATUS_CHANGED:
                this.notifyHandlers('userStatusChanged', data);
                break;
        }
    }

    handleTypingEvent(event) {
        const { type, data } = event;
        switch (type) {
            case WebSocketConfig.EVENT_TYPES.TYPING_STARTED:
                this.notifyHandlers('typingStarted', data);
                break;
            case WebSocketConfig.EVENT_TYPES.TYPING_STOPPED:
                this.notifyHandlers('typingStopped', data);
                break;
        }
    }

    sendMessage(chatId, message) {
        if (!this.connected) return;

        this.client.publish({
            destination: WebSocketConfig.ENDPOINTS.SEND_MESSAGE,
            body: JSON.stringify({
                chatId,
                content: message.content,
                type: message.type,
                senderId: message.senderId
            })
        });
    }

    updateMessage(chatId, messageId, content) {
        if (!this.connected) return;

        this.client.publish({
            destination: WebSocketConfig.ENDPOINTS.UPDATE_MESSAGE,
            body: JSON.stringify({
                chatId,
                messageId,
                content
            })
        });
    }

    deleteMessage(chatId, messageId) {
        if (!this.connected) return;

        this.client.publish({
            destination: WebSocketConfig.ENDPOINTS.DELETE_MESSAGE,
            body: JSON.stringify({
                chatId,
                messageId
            })
        });
    }

    sendTypingStatus(chatId, userId, isTyping) {
        if (!this.connected) return;

        this.client.publish({
            destination: WebSocketConfig.getTypingEndpoint(chatId),
            body: JSON.stringify({
                userId,
                isTyping
            })
        });
    }

    on(event, handler) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, new Set());
        }
        this.messageHandlers.get(event).add(handler);
    }

    off(event, handler) {
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    notifyHandlers(event, data) {
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.connected = false;
            this.subscriptions.clear();
            this.messageHandlers.clear();
        }
    }
}

export const websocketService = new WebSocketService(); 