import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import chatService from '../services/chatService';
import { useSocket } from './SocketContext';
import axios from 'axios';
import { websocketService } from '../services/websocketService';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { socket, connected } = useSocket();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [userStatuses, setUserStatuses] = useState({});

  // Function to sort chats by last message time
  const sortChatsByLastMessage = (chatsToSort) => {
    return [...chatsToSort].sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime) : new Date(0);
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime) : new Date(0);
      return timeB - timeA;
    });
  };

  // Function to refresh chats
  const refreshChats = useCallback(async () => {
    try {
      console.log('Refreshing chats list');
      const response = await chatService.getChats();
      
      const sortedChats = sortChatsByLastMessage(response);
      setChats(sortedChats);
      
      // Update current chat if it exists in the new list
      if (currentChat) {
        const updatedCurrentChat = sortedChats.find(chat => chat.id === currentChat.id);
        if (updatedCurrentChat) {
          setCurrentChat(updatedCurrentChat);
        }
      }
    } catch (error) {
      console.error('Error refreshing chats:', error);
    }
  }, [currentChat]);

  // Fetch chats when user logs in
  useEffect(() => {
    const fetchChats = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const fetchedChats = await chatService.getChats();
        
        // Sort chats by last message time (most recent first)
        const sortedChats = sortChatsByLastMessage(fetchedChats);
        
        setChats(sortedChats);
        
        // If there are chats, select the first one by default
        if (sortedChats.length > 0 && !currentChat) {
          setCurrentChat(sortedChats[0]);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Failed to load chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [currentUser, currentChat]);

  // Fetch messages when current chat changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat) return;

      try {
        console.log('Fetching messages for chat:', currentChat);
        if (currentChat.isDraft) {
          setMessages([]);
          return;
        }
        setLoading(true);
        const fetchedMessages = await chatService.getMessages(currentChat.id);
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentChat]);

  // Handle real-time messages
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewMessage = (message) => {
      console.log('Received new message:', message);
      
      // Only append message to messages state if it belongs to the current chat
      if (currentChat && message.chatId === currentChat.id) {
        setMessages(prev => [...prev, message]);
      }
      
      // Update chat's last message and timestamp
      setChats(prev => {
        const updatedChats = prev.map(chat => 
          chat.id === message.chatId
            ? {
                ...chat,
                lastMessage: message.content,
                lastMessageTime: message.createdAt,
                updatedAt: message.createdAt,
                unreadCount: chat.id === currentChat?.id ? 0 : (chat.unreadCount || 0) + 1
              }
            : chat
        );

        // Find the chat that was updated
        const updatedChat = updatedChats.find(chat => chat.id === message.chatId);
        
        // If chat exists, move it to the top
        if (updatedChat) {
          const filteredChats = updatedChats.filter(chat => chat.id !== message.chatId);
          return [updatedChat, ...filteredChats];
        }

        return updatedChats;
      });

      // If this is a new chat, add it to the list
      if (!chats.some(chat => chat.id === message.chatId)) {
        // Fetch the chat details and add it to the list
        chatService.getChat(message.chatId)
          .then(newChat => {
            if (newChat) {
              setChats(prev => [newChat, ...prev]);
            }
          })
          .catch(error => {
            console.error('Error fetching new chat:', error);
          });
      }
    };

    const handleMessageUpdate = (updatedMessage) => {
      // Only update message in messages state if it belongs to the current chat
      if (currentChat && updatedMessage.chatId === currentChat.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ));
      }

      // Update chat's last message if this was the last message
      setChats(prev => {
        const updatedChats = prev.map(chat => 
          chat.id === updatedMessage.chatId
            ? {
                ...chat,
                lastMessage: updatedMessage.content,
                lastMessageTime: updatedMessage.createdAt,
                updatedAt: updatedMessage.createdAt
              }
            : chat
        );

        const updatedChat = updatedChats.find(chat => chat.id === updatedMessage.chatId);
        if (updatedChat) {
          const filteredChats = updatedChats.filter(chat => chat.id !== updatedMessage.chatId);
          return [updatedChat, ...filteredChats];
        }

        return updatedChats;
      });
    };

    const handleMessageDelete = (messageId) => {
      // Only remove message from messages state if it belongs to the current chat
      if (currentChat) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }

      // Update chat's last message if this was the last message
      setChats(prev => {
        const updatedChats = prev.map(chat => {
          if (chat.id === currentChat?.id) {
            const remainingMessages = messages.filter(msg => msg.id !== messageId);
            const lastMessage = remainingMessages[remainingMessages.length - 1];
            return {
              ...chat,
              lastMessage: lastMessage?.content || null,
              lastMessageTime: lastMessage?.createdAt || null,
              updatedAt: lastMessage?.createdAt || chat.updatedAt
            };
          }
          return chat;
        });

        const updatedChat = updatedChats.find(chat => chat.id === currentChat?.id);
        if (updatedChat) {
          const filteredChats = updatedChats.filter(chat => chat.id !== currentChat?.id);
          return [updatedChat, ...filteredChats];
        }

        return updatedChats;
      });
    };

    const handleNewChat = (chat) => {
      console.log('Received new chat:', chat);
      setChats(prev => [chat, ...prev]);
    };

    const handleChatUpdate = (updatedChat) => {
      console.log('Received chat update:', updatedChat);
      setChats(prev => {
        const updatedChats = prev.map(chat => 
          chat.id === updatedChat.id ? updatedChat : chat
        );
        const updatedChatFound = updatedChats.find(chat => chat.id === updatedChat.id);
        if (updatedChatFound) {
          const filteredChats = updatedChats.filter(chat => chat.id !== updatedChat.id);
          return [updatedChatFound, ...filteredChats];
        }
        return updatedChats;
      });
      
      if (currentChat?.id === updatedChat.id) {
        setCurrentChat(updatedChat);
      }
    };

    // Subscribe to WebSocket events
    socket.on('message:new', handleNewMessage);
    socket.on('message:update', handleMessageUpdate);
    socket.on('message:delete', handleMessageDelete);
    socket.on('chat:new', handleNewChat);
    socket.on('chat:update', handleChatUpdate);

    return () => {
      // Unsubscribe from WebSocket events
      socket.off('message:new', handleNewMessage);
      socket.off('message:update', handleMessageUpdate);
      socket.off('message:delete', handleMessageDelete);
      socket.off('chat:new', handleNewChat);
      socket.off('chat:update', handleChatUpdate);
    };
  }, [socket, connected, currentChat, chats, messages]);

  // Add reaction handling functions
  const handleAddReaction = async (messageId, emoji) => {
    if (!currentChat) {
      console.error('No current chat selected');
      return;
    }

    try {
      console.log('Adding reaction:', { chatId: currentChat.id, messageId, emoji });
      const updatedMessage = await chatService.addReaction(currentChat.id, messageId, emoji);
      console.log('Reaction added successfully:', updatedMessage);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw new Error('Failed to add reaction');
    }
  };

  const handleRemoveReaction = async (messageId, emoji) => {
    if (!currentChat) {
      console.error('No current chat selected');
      return;
    }

    try {
      console.log('Removing reaction:', { chatId: currentChat.id, messageId, emoji });
      const updatedMessage = await chatService.removeReaction(currentChat.id, messageId, emoji);
      console.log('Reaction removed successfully:', updatedMessage);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw new Error('Failed to remove reaction');
    }
  };

  const handleEditReaction = async (messageId, oldEmoji, newEmoji) => {
    if (!currentChat) {
      console.error('No current chat selected');
      return;
    }

    try {
      console.log('Editing reaction:', { chatId: currentChat.id, messageId, oldEmoji, newEmoji });
      const updatedMessage = await chatService.editReaction(currentChat.id, messageId, oldEmoji, newEmoji);
      console.log('Reaction edited successfully:', updatedMessage);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
    } catch (error) {
      console.error('Error editing reaction:', error);
      throw new Error('Failed to edit reaction');
    }
  };

  // Add socket event listener for reaction updates
  useEffect(() => {
    if (!socket || !connected) return;

    socket.on('message:reaction', (updatedMessage) => {
      console.log('Received reaction update:', updatedMessage);
      
      // Only update message in messages state if it belongs to the current chat
      if (currentChat && updatedMessage.chatId === currentChat.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ));
      }
    });

    return () => {
      socket.off('message:reaction');
    };
  }, [socket, connected, currentChat]);

  const selectChat = (chat) => {
    if (!chat || !chat.id) {
      console.error('Invalid chat selected:', chat);
      return;
    }
    
    setCurrentChat(chat);
    // Reset unread count for selected chat
    setUnreadCounts(prev => ({
      ...prev,
      [chat.id]: 0
    }));
  };

  const sendMessage = async (chatId, content) => {
    if (!chatId) {
      console.error('No chatId provided for sending message');
      return;
    }

    try {
      console.log("Sending message:", { chatId, content });
      const message = await chatService.sendMessage(chatId, content);
      
      // Add message to messages state
      setMessages(prev => [...prev, message]);
      
      // Update chat's last message and timestamp, and move it to the top
      setChats(prev => {
        const updatedChats = prev.map(chat => 
          chat.id === chatId
            ? {
                ...chat,
                lastMessage: message.content,
                lastMessageTime: message.createdAt,
                updatedAt: message.createdAt
              }
            : chat
        );

        // Find the updated chat
        const updatedChat = updatedChats.find(chat => chat.id === chatId);
        
        // Move the updated chat to the top
        if (updatedChat) {
          const filteredChats = updatedChats.filter(chat => chat.id !== chatId);
          return [updatedChat, ...filteredChats];
        }

        return updatedChats;
      });
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  };

  const editMessage = async (messageId, content) => {
    if (!currentChat) return;

    try {
      const updatedMessage = await chatService.editMessage(currentChat.id, messageId, content);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
      
      // Update chat's last message if this was the last message
      if (messages[messages.length - 1]?.id === messageId) {
        setChats(prev => prev.map(chat => 
          chat.id === currentChat.id
            ? {
                ...chat,
                lastMessage: content,
                lastMessageTime: updatedMessage.createdAt,
                updatedAt: updatedMessage.createdAt
              }
            : chat
        ));
      }
    } catch (error) {
      console.error('Error editing message:', error);
      throw new Error('Failed to edit message');
    }
  };

  const deleteMessage = async (messageId) => {
    if (!currentChat) return;

    try {
      await chatService.deleteMessage(currentChat.id, messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Update chat's last message if this was the last message
      if (messages[messages.length - 1]?.id === messageId) {
        const remainingMessages = messages.filter(msg => msg.id !== messageId);
        const lastMessage = remainingMessages[remainingMessages.length - 1];
        
        setChats(prev => prev.map(chat => 
          chat.id === currentChat.id
            ? {
                ...chat,
                lastMessage: lastMessage?.content || null,
                lastMessageTime: lastMessage?.createdAt || null,
                updatedAt: lastMessage?.createdAt || chat.updatedAt
              }
            : chat
        ));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  };

  const createNewChat = async (userId) => {
    try {
      const newChat = await chatService.createPrivateChat(userId);
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw new Error('Failed to create chat');
    }
  };

  const createGroupChat = async (groupData) => {
    try {
      const newChat = await chatService.createGroupChat(groupData);
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      return newChat;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw new Error('Failed to create group chat');
    }
  };

  const createChannel = async (channelData) => {
    try {
      const newChannel = await chatService.createChannel(channelData);
      setChats(prev => [newChannel, ...prev]);
      setCurrentChat(newChannel);
      return newChannel;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw new Error('Failed to create channel');
    }
  };

  const addParticipant = async (chatId, userId) => {
    try {
      const updatedChat = await chatService.addParticipant(chatId, userId);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat);
      }
      return updatedChat;
    } catch (error) {
      console.error('Error adding participant:', error);
      throw new Error('Failed to add participant');
    }
  };

  const removeParticipant = async (chatId, userId) => {
    try {
      const updatedChat = await chatService.removeParticipant(chatId, userId);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat);
      }
      return updatedChat;
    } catch (error) {
      console.error('Error removing participant:', error);
      throw new Error('Failed to remove participant');
    }
  };

  const addAdmin = async (chatId, userId) => {
    try {
      const updatedChat = await chatService.addAdmin(chatId, userId);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat);
      }
      return updatedChat;
    } catch (error) {
      console.error('Error adding admin:', error);
      throw new Error('Failed to add admin');
    }
  };

  const removeAdmin = async (chatId, userId) => {
    try {
      const updatedChat = await chatService.removeAdmin(chatId, userId);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat);
      }
      return updatedChat;
    } catch (error) {
      console.error('Error removing admin:', error);
      throw new Error('Failed to remove admin');
    }
  };

  // Function to update a chat's last message
  const updateChatLastMessage = useCallback((chatId, messageInfo) => {
    console.log('Updating last message for chat:', chatId, messageInfo);
    
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: messageInfo.content,
            lastMessageTime: messageInfo.timestamp,
            lastMessageSenderId: messageInfo.senderId,
            updatedAt: messageInfo.timestamp
          };
        }
        return chat;
      });

      // Sort chats by last message time
      return sortChatsByLastMessage(updatedChats);
    });
  }, []);

  // Function to add a new message
  const addMessage = useCallback((message) => {
    console.log('Adding new message:', message);
    
    // Only add message if it belongs to the current chat
    if (!currentChat || message.chatId !== currentChat.id) {
      console.log('Message does not belong to current chat, not adding:', message.id);
      return;
    }
    
    setMessages(prev => {
      // Check if message already exists
      const messageExists = prev.some(m => m.id === message.id);
      if (messageExists) {
        console.log('Message already exists, not adding:', message.id);
        return prev;
      }
      
      // Add new message and sort
      const newMessages = [...prev, message].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      console.log('Updated messages:', newMessages);
      return newMessages;
    });
  }, [currentChat]);

  const value = {
    chats,
    currentChat,
    messages,
    loading,
    error,
    setError,
    unreadCounts,
    selectChat,
    sendMessage,
    editMessage,
    deleteMessage,
    createNewChat,
    createGroupChat,
    createChannel,
    addParticipant,
    removeParticipant,
    addAdmin,
    removeAdmin,
    userStatuses,
    addMessage,
    updateChatLastMessage,
    refreshChats,
    setMessages,
    setChats,
    handleAddReaction,
    handleRemoveReaction,
    handleEditReaction,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
