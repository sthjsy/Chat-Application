import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';
import { WS_URLS, WS_MESSAGE_TYPES } from '../constants/websocket-urls';
import { MessageType } from '../constants/messageTypes';

// Create context
const SocketContext = createContext(null);

// Socket Provider component
export const SocketProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [stompClient, setStompClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState(new Map());
  const navigate = useNavigate();

  // Socket connection setup
  useEffect(() => {
    let client = null;

    const initSocket = () => {
      if (!isAuthenticated || !currentUser?.id) {
        console.log('Not authenticated or no user ID');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Debug token
      console.log('Connecting with token:', token);
      console.log('User ID:', currentUser.id);

      // Create STOMP client
      console.log('Initializing WebSocket connection to:', WS_URLS.BASE_URL);
      client = new Client({
        webSocketFactory: () => new SockJS(WS_URLS.BASE_URL, null, {
          transports: ['websocket'],
          withCredentials: false
        }),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => {
          console.log('STOMP: ' + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      });

      client.beforeConnect = () => {
        // Add headers to the underlying transport
        const sockjs = client.webSocket;
        if (sockjs && sockjs.xhr) {
          sockjs.xhr.withCredentials = false;
          sockjs.xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
      };

      client.onConnect = (frame) => {
        console.log('Connected to WebSocket');
        setConnected(true);
        setStompClient(client);

        // Subscribe to personal error channel
        client.subscribe(WS_URLS.SUBSCRIBE.ERRORS(currentUser.id), error => {
          console.error('Received error:', error.body);
        });

        // Subscribe to user's personal message queue
        client.subscribe(WS_URLS.SUBSCRIBE.USER_QUEUE(currentUser.id), message => {
          try {
            const messageData = JSON.parse(message.body);
            console.log('Received personal message:', messageData);
            
            // Emit the message event to the chat topic
            client.publish({
              destination: WS_URLS.SUBSCRIBE.CHAT_MESSAGES(messageData.chatId),
              body: JSON.stringify(messageData)
            });

            // Emit chat update event
            client.publish({
              destination: `/user/${currentUser.id}/queue/chat.events`,
              body: JSON.stringify({
                type: 'CHAT_UPDATE',
                chat: {
                  id: messageData.chatId,
                  lastMessage: messageData.content,
                  lastMessageTime: messageData.timestamp,
                  updatedAt: messageData.timestamp,
                  unreadCount: messageData.senderId !== currentUser.id ? 1 : 0
                }
              })
            });
          } catch (error) {
            console.error('Error handling personal message:', error);
          }
        });

        // Subscribe to chat events
        client.subscribe(WS_URLS.SUBSCRIBE.CHAT_EVENTS(currentUser.id), event => {
          try {
            const eventData = JSON.parse(event.body);
            console.log('Received chat event:', eventData);
            
            // Forward the event to the user's personal queue
            client.publish({
              destination: `/user/${currentUser.id}/queue/chat.events`,
              body: JSON.stringify(eventData)
            });
          } catch (error) {
            console.error('Error handling chat event:', error);
          }
        });

        // Notify server about connection
        client.publish({
          destination: WS_URLS.PUBLISH.ADD_USER,
          body: JSON.stringify({
            userId: currentUser.id,
            username: currentUser.username
          })
        });

        // Set initial status
        updateStatus('ONLINE');
      };

      client.onStompError = (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        setConnected(false);
        
        if (frame.headers['message'].includes('Unauthorized') || 
            frame.headers['message'].includes('authentication')) {
          console.log('Authentication failed, clearing token and redirecting to login');
          localStorage.removeItem('token');
          setStompClient(null);
          navigate('/login');
        }
      };

      client.onWebSocketError = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

      client.onDisconnect = () => {
        console.log('Disconnected from WebSocket');
        setConnected(false);
      };

      // Activate the client
      client.activate();
    };

    initSocket();

    // Cleanup on unmount or when auth state changes
    return () => {
      if (client) {
        cleanup();
      }
    };
  }, [isAuthenticated, currentUser, navigate]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (stompClient) {
      updateStatus('OFFLINE');
      Array.from(activeSubscriptions.values()).forEach(sub => sub.unsubscribe());
      setActiveSubscriptions(new Map());
      stompClient.deactivate();
      setStompClient(null);
      setConnected(false);
    }
  }, [stompClient, activeSubscriptions]);

  // Subscribe to a chat room
  const subscribeToChat = useCallback((chatId) => {
    if (!stompClient || !connected || !currentUser?.id) return;

    console.log(`Subscribing to chat ${chatId}`);
    const newSubscriptions = [];

    // Subscribe to chat messages
    const messageSubscription = stompClient.subscribe(
      WS_URLS.SUBSCRIBE.CHAT_MESSAGES(chatId),
      message => {
        const messageData = JSON.parse(message.body);
        console.log('Received message:', messageData);
        // Handle new message
      }
    );
    newSubscriptions.push(messageSubscription);

    // Subscribe to typing indicators
    const typingSubscription = stompClient.subscribe(
      WS_URLS.SUBSCRIBE.CHAT_TYPING(chatId),
      status => {
        const typingStatus = JSON.parse(status.body);
        console.log('Typing status:', typingStatus);
        // Handle typing status
      }
    );
    newSubscriptions.push(typingSubscription);

    // Subscribe to chat events
    const eventSubscription = stompClient.subscribe(
      WS_URLS.SUBSCRIBE.CHAT_EVENTS(currentUser.id),
      event => {
        const eventData = JSON.parse(event.body);
        console.log('Chat event:', eventData);
        // Handle chat event
      }
    );
    newSubscriptions.push(eventSubscription);

    // Subscribe to call signals
    const callSubscription = stompClient.subscribe(
      WS_URLS.SUBSCRIBE.CALL_SIGNALING(chatId),
      signal => {
        const callSignal = JSON.parse(signal.body);
        console.log('Call signal:', callSignal);
        // Handle call signal
      }
    );
    newSubscriptions.push(callSubscription);

    setActiveSubscriptions(prev => new Map(prev.set(chatId, newSubscriptions)));
  }, [stompClient, connected, currentUser]);

  // Send message
  const sendMessage = useCallback(async (chatId, content, attachments = []) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Preparing to send message:', { chatId, content });

      let messageType = MessageType.TEXT;
      let attachmentUrls = [];

      if (attachments.length > 0) {
        // Handle attachments here
        const firstFile = attachments[0];
        if (firstFile.type.startsWith('image/')) {
          messageType = MessageType.IMAGE;
        } else if (firstFile.type.startsWith('video/')) {
          messageType = MessageType.VIDEO;
        } else if (firstFile.type.startsWith('audio/')) {
          messageType = MessageType.AUDIO;
        } else {
          messageType = MessageType.FILE;
        }
      }

      const message = {
        chatId,
        senderId: currentUser.id,
        senderName: currentUser.username,
        content,
        messageType,
        attachments: attachmentUrls,
        timestamp: new Date().toISOString()
      };

      console.log('Sending message via WebSocket:', message);

      stompClient.publish({
        destination: WS_URLS.PUBLISH.SEND_MESSAGE,
        body: JSON.stringify(message)
      });

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [stompClient, connected, currentUser]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((chatId, isTyping = true) => {
    if (!stompClient || !connected) return;
    
    console.log('Sending typing indicator:', { chatId, isTyping });
    stompClient.publish({
      destination: WS_URLS.PUBLISH.TYPING_INDICATOR(chatId),
      body: JSON.stringify({
        userId: currentUser.id,
        username: currentUser.username,
        isTyping
      })
    });
  }, [stompClient, connected, currentUser]);

  // Mark messages as read
  const markMessagesAsRead = useCallback((chatId, messageIds) => {
    if (!stompClient || !connected) return;
    
    console.log('Marking messages as read:', { chatId, messageIds });
    stompClient.publish({
      destination: WS_URLS.PUBLISH.MARK_READ,
      body: JSON.stringify({
        chatId,
        userId: currentUser.id,
        messageIds
      })
    });
  }, [stompClient, connected, currentUser]);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
  }, []);

  // Update user status
  const updateStatus = useCallback((status) => {
    if (!stompClient || !connected) return;
    
    console.log('Updating user status:', status);
    stompClient.publish({
      destination: WS_URLS.PUBLISH.USER_STATUS,
      body: JSON.stringify({
        userId: currentUser.id,
        username: currentUser.username,
        status
      })
    });
  }, [stompClient, connected, currentUser]);

  // Initialize call
  const initiateCall = useCallback((chatId, callType = 'VIDEO') => {
    if (!stompClient || !connected) return;

    const sessionId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Initiating call:', { chatId, callType, sessionId });
    stompClient.publish({
      destination: WS_URLS.PUBLISH.CALL_SIGNAL(chatId),
      body: JSON.stringify({
        type: 'offer',
        callType: callType,
        sessionId: sessionId,
        senderId: currentUser.id,
        senderName: currentUser.username
      })
    });

    return sessionId;
  }, [stompClient, connected, currentUser]);

  // Value to be provided by the context
  const value = {
    connected,
    onlineUsers,
    notifications,
    sendMessage,
    sendTypingIndicator,
    markMessagesAsRead,
    markNotificationAsRead,
    updateStatus,
    subscribeToChat,
    initiateCall,
    subscribe: useCallback((destination, callback) => {
      if (!stompClient) {
        console.error('STOMP client not available');
        return null;
      }
      console.log('Subscribing to:', destination);
      return stompClient.subscribe(destination, callback);
    }, [stompClient]),
    unsubscribe: useCallback((subscription) => {
      if (subscription) {
        console.log('Unsubscribing from:', subscription.id);
        subscription.unsubscribe();
      }
    }, []),
    disconnect: cleanup
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;