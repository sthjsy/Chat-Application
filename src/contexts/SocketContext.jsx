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

      // Create STOMP client with headers
      console.log('Initializing WebSocket connection to:', WS_URLS.BASE_URL);
      client = new Client({
        webSocketFactory: () => new SockJS(WS_URLS.BASE_URL, null, {
          transports: ['websocket'],
          withCredentials: false
        }),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          userId: currentUser.id.toString(),
          username: currentUser.username,
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          role: currentUser.role || 'USER',
          deviceInfo: navigator.userAgent,
          clientVersion: '1.0.0', // Add your app version here
          connectionType: 'web'
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
          sockjs.xhr.setRequestHeader('userId', currentUser.id.toString());
          sockjs.xhr.setRequestHeader('username', currentUser.username);
          sockjs.xhr.setRequestHeader('fullName', currentUser.fullName || '');
          sockjs.xhr.setRequestHeader('email', currentUser.email || '');
          sockjs.xhr.setRequestHeader('role', currentUser.role || 'USER');
          sockjs.xhr.setRequestHeader('deviceInfo', navigator.userAgent);
          sockjs.xhr.setRequestHeader('clientVersion', '1.0.0');
          sockjs.xhr.setRequestHeader('connectionType', 'web');
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
            username: currentUser.username,
            fullName: currentUser.fullName || '',
            email: currentUser.email || '',
            role: currentUser.role || 'USER',
            deviceInfo: navigator.userAgent,
            clientVersion: '1.0.0',
            connectionType: 'web'
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

    // Subscribe to deleted messages
    const deletedMessageSubscription = stompClient.subscribe(
      WS_URLS.SUBSCRIBE.CHAT_MESSAGES_DELETED(chatId),
      message => {
        const messageId = JSON.parse(message.body);
        console.log('Message deleted:', messageId);
        // Handle deleted message
      }
    );
    newSubscriptions.push(deletedMessageSubscription);

    // Subscribe to message reactions
    const reactionSubscription = stompClient.subscribe(
      WS_URLS.SUBSCRIBE.CHAT_MESSAGES_REACTIONS(chatId),
      message => {
        const messageData = JSON.parse(message.body);
        console.log('Message reaction added:', messageData);
        // Handle message reaction
      }
    );
    newSubscriptions.push(reactionSubscription);

    // Subscribe to removed reactions
    const removedReactionSubscription = stompClient.subscribe(
      WS_URLS.SUBSCRIBE.CHAT_MESSAGES_REACTIONS_REMOVED(chatId),
      message => {
        const messageData = JSON.parse(message.body);
        console.log('Message reaction removed:', messageData);
        // Handle removed reaction
      }
    );
    newSubscriptions.push(removedReactionSubscription);

    // Subscribe to read messages
    const readMessageSubscription = stompClient.subscribe(
      WS_URLS.SUBSCRIBE.CHAT_MESSAGES_READ(chatId),
      message => {
        const messageData = JSON.parse(message.body);
        console.log('Message read:', messageData);
        // Handle read message
      }
    );
    newSubscriptions.push(readMessageSubscription);

    // Subscribe to read all messages
    const readAllMessagesSubscription = stompClient.subscribe(
      WS_URLS.SUBSCRIBE.CHAT_MESSAGES_READ_ALL(chatId),
      message => {
        const messageData = JSON.parse(message.body);
        console.log('All messages read:', messageData);
        // Handle read all messages
      }
    );
    newSubscriptions.push(readAllMessagesSubscription);

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

    // Subscribe to chat topic
    const chatTopicSubscription = stompClient.subscribe(
      `/topic/chat/${chatId}`,
      chat => {
        const chatData = JSON.parse(chat.body);
        console.log('Chat topic update:', chatData);
        // Handle chat topic update
      }
    );
    newSubscriptions.push(chatTopicSubscription);

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

  // Create private chat
  const createPrivateChat = useCallback((userId, chatName, description) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Creating private chat:', { userId, chatName, description });

      const payload = {
        chatType: 'PRIVATE',
        userId,
        chatName: chatName || 'Private Chat',
        description: description || 'Private conversation'
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.CREATE_CHAT,
        body: JSON.stringify(payload)
      });

      return payload;
    } catch (error) {
      console.error('Error creating private chat:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Create group chat
  const createGroupChat = useCallback((chatName, description, participantIds, isPublic = false) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Creating group chat:', { chatName, description, participantIds, isPublic });

      const payload = {
        chatType: 'GROUP',
        chatName,
        description,
        participantIds,
        isPublic
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.CREATE_CHAT,
        body: JSON.stringify(payload)
      });

      return payload;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Update chat
  const updateChat = useCallback((chatId, chatName, description) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Updating chat:', { chatId, chatName, description });

      const payload = {
        chatId,
        chatName,
        description
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.UPDATE_CHAT,
        body: JSON.stringify(payload)
      });

      return payload;
    } catch (error) {
      console.error('Error updating chat:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Delete chat
  const deleteChat = useCallback((chatId) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Deleting chat:', { chatId });

      const payload = {
        chatId
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.DELETE_CHAT,
        body: JSON.stringify(payload)
      });

      return payload;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Add participant to chat
  const addParticipant = useCallback((chatId, userId) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Adding participant to chat:', { chatId, userId });

      const payload = {
        chatId,
        userId
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.ADD_PARTICIPANT,
        body: JSON.stringify(payload)
      });

      return payload;
    } catch (error) {
      console.error('Error adding participant to chat:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Remove participant from chat
  const removeParticipant = useCallback((chatId, userId) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Removing participant from chat:', { chatId, userId });

      const payload = {
        chatId,
        userId
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.REMOVE_PARTICIPANT,
        body: JSON.stringify(payload)
      });

      return payload;
    } catch (error) {
      console.error('Error removing participant from chat:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Leave chat
  const leaveChat = useCallback((chatId) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Leaving chat:', { chatId });

      const payload = {
        chatId
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.LEAVE_CHAT,
        body: JSON.stringify(payload)
      });

      return payload;
    } catch (error) {
      console.error('Error leaving chat:', error);
      throw error;
    }
  }, [stompClient, connected]);

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
        content,
        messageType
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
  }, [stompClient, connected]);

  // Edit message
  const editMessage = useCallback((messageId, chatId, content) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Editing message:', { messageId, chatId, content });

      const message = {
        messageId,
        chatId,
        content
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.EDIT_MESSAGE,
        body: JSON.stringify(message)
      });

      return message;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Delete message
  const deleteMessage = useCallback((messageId, chatId) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Deleting message:', { messageId, chatId });

      const message = {
        messageId,
        chatId
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.DELETE_MESSAGE,
        body: JSON.stringify(message)
      });

      return message;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Add reaction to message
  const addReaction = useCallback((messageId, chatId, reactionType) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Adding reaction:', { messageId, chatId, reactionType });

      const message = {
        messageId,
        chatId,
        reactionType
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.ADD_REACTION,
        body: JSON.stringify(message)
      });

      return message;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Remove reaction from message
  const removeReaction = useCallback((messageId, chatId, reactionType) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Removing reaction:', { messageId, chatId, reactionType });

      const message = {
        messageId,
        chatId,
        reactionType
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.REMOVE_REACTION,
        body: JSON.stringify(message)
      });

      return message;
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Mark message as read
  const markMessageAsRead = useCallback((messageId, chatId) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Marking message as read:', { messageId, chatId });

      const message = {
        messageId,
        chatId
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.READ_MESSAGE,
        body: JSON.stringify(message)
      });

      return message;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Mark all messages as read
  const markMessagesAsRead = useCallback((chatId) => {
    if (!stompClient || !connected) {
      console.error('STOMP client not connected');
      return;
    }

    try {
      console.log('Marking all messages as read:', { chatId });

      const message = {
        chatId
      };

      stompClient.publish({
        destination: WS_URLS.PUBLISH.READ_ALL_MESSAGES,
        body: JSON.stringify(message)
      });

      return message;
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      throw error;
    }
  }, [stompClient, connected]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((chatId) => {
    if (!stompClient || !connected) return;
    
    console.log('Sending typing indicator:', { chatId });
    stompClient.publish({
      destination: WS_URLS.PUBLISH.TYPING_INDICATOR,
      body: JSON.stringify({
        chatId
      })
    });
  }, [stompClient, connected]);

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
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markMessageAsRead,
    markMessagesAsRead,
    sendTypingIndicator,
    markNotificationAsRead,
    updateStatus,
    subscribeToChat,
    initiateCall,
    createPrivateChat,
    createGroupChat,
    updateChat,
    deleteChat,
    addParticipant,
    removeParticipant,
    leaveChat,
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