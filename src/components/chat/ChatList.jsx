// ChatList.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import ChatItem from './ChatItem';
import { FiSearch, FiPlus, FiFilter } from 'react-icons/fi';
import { Form, InputGroup } from 'react-bootstrap';
import chatService from '../../services/chatService';
import { WS_URLS } from '../../constants/websocket-urls';

const ChatList = () => {
  const { 
    chats, 
    currentChat, 
    selectChat, 
    userStatuses,
    updateChatLastMessage,
    refreshChats,
    setChats
  } = useChat();
  const { currentUser } = useAuth();
  const { subscribe, unsubscribe, connected } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const scrollRef = useRef(null);

  // Log current chats whenever they change
  useEffect(() => {
    console.log('ChatList: Current chats updated', chats);
  }, [chats]);

  useEffect(() => {
    if (!connected || !currentUser?.id) {
      console.log('ChatList: Not connected or no current user, skipping subscriptions');
      return;
    }

    console.log('ChatList: Setting up subscriptions for user', currentUser.id);

    
    // Subscribe to user-specific messages for all chats
    const messageSubscription = subscribe(`/user/${currentUser.id}/queue/messages`, (message) => {
      try {
        const messageData = JSON.parse(message.body);
        console.log('ChatList: Received message event:', messageData);
        
        // Update the chat's last message
        if (messageData.chatId) {
          console.log('ChatList: Updating last message for chat', messageData.chatId);
          updateChatLastMessage(messageData.chatId, {
            content: messageData.content,
            timestamp: messageData.createdAt,
            senderId: messageData.senderId
          });

          // If this is a new chat, add it to the list
          if (!chats.some(chat => chat.id === messageData.chatId)) {
            console.log('ChatList: New chat detected, fetching chat details');
            chatService.getChat(messageData.chatId)
              .then(newChat => {
                if (newChat) {
                  console.log('ChatList: Adding new chat to list', newChat);
                  setChats(prev => [newChat, ...prev]);
                }
              })
              .catch(error => {
                console.error('ChatList: Error fetching new chat:', error);
              });
          } else {
            // Update existing chat with new message
            console.log('ChatList: Updating existing chat with new message');
            setChats(prev => {
              const updatedChats = prev.map(chat => {
                if (chat.id === messageData.chatId) {
                  return {
                    ...chat,
                    lastMessage: messageData.content,
                    lastMessageTime: messageData.timestamp,
                    lastMessageSenderId: messageData.senderId,
                    lastMessageId: messageData.id
                  };
                }
                return chat;
              });
              
              // Move the updated chat to the top
              const updatedChat = updatedChats.find(chat => chat.id === messageData.chatId);
              if (updatedChat) {
                const filteredChats = updatedChats.filter(chat => chat.id !== messageData.chatId);
                return [updatedChat, ...filteredChats];
              }
              return updatedChats;
            });
          }
        } else {
          console.warn('ChatList: Received message without chatId', messageData);
        }
      } catch (error) {
        console.error('ChatList: Error handling message:', error);
      }
    });

    
    const chatEventSubscription = subscribe(`/topic/chat/${currentUser.id}/chat/events`, (event) => {
      try {
        const eventData = JSON.parse(event.body);
        console.log('ChatList: Received chat event:', eventData);
        
        // Handle different event types
        switch (eventData.eventType) {
          case 'NEW_CHAT':
            console.log('ChatList: Processing NEW_CHAT event');
            // Add new chat to the top of the list
            const existingChat = chats.find(c => c.id === eventData.id);
            if (existingChat) {
              console.log('ChatList: Chat already exists, skipping');
            } else {
              console.log('ChatList: Chat does not exist, adding to list');
              setChats(prev => [eventData, ...prev]);
            }
            break;
            
          case 'CHAT_UPDATE':
            console.log('ChatList: Processing CHAT_UPDATE event');
            // Update existing chat and move it to the top
            setChats(prev => {
              const updatedChats = prev.map(chat => 
                chat.id === eventData.id ? eventData : chat
              );
              const updatedChat = updatedChats.find(chat => chat.id === eventData.id);
              if (updatedChat) {
                const filteredChats = updatedChats.filter(chat => chat.id !== eventData.id);
                return [updatedChat, ...filteredChats];
              }
              return updatedChats;
            });
            break;
            
          case 'CHAT_DELETED':
            console.log('ChatList: Processing CHAT_DELETED event');
            // Remove chat from the list
            setChats(prev => prev.filter(chat => chat.id !== eventData.id));
            break;
            
          case 'PARTICIPANTS_UPDATED':
            console.log('ChatList: Processing PARTICIPANTS_UPDATED event');
            // Update chat with new participants
            setChats(prev => prev.map(chat => 
              chat.id === eventData.id ? eventData : chat
            ));
            break;
            
          case 'REMOVED_FROM_CHAT':
            console.log('ChatList: Processing REMOVED_FROM_CHAT event');
            // Remove chat if user was removed
            setChats(prev => prev.filter(chat => chat.id !== eventData.id));
            break;
            
          case 'USER_LEFT':
            console.log('ChatList: Processing USER_LEFT event');
            // Update chat when a user leaves
            setChats(prev => prev.map(chat => 
              chat.id === eventData.id ? eventData : chat
            ));
            break;
            
          case 'NEW_MESSAGE':
            console.log('ChatList: Processing NEW_MESSAGE event');
            // Update chat with new message
            setChats(prev => {
              const updatedChats = prev.map(chat => 
                chat.id === eventData.id ? eventData : chat
              );
              const updatedChat = updatedChats.find(chat => chat.id === eventData.id);
              if (updatedChat) {
                const filteredChats = updatedChats.filter(chat => chat.id !== eventData.id);
                return [updatedChat, ...filteredChats];
              }
              return updatedChats;
            });
            break;
            
          case 'MESSAGE_UPDATED':
            console.log('ChatList: Processing MESSAGE_UPDATED event');
            // Update chat with updated message
            setChats(prev => prev.map(chat => 
              chat.id === eventData.id ? eventData : chat
            ));
            break;
            
          default:
            console.log('ChatList: Unhandled chat event type:', eventData.eventType);
        }
      } catch (error) {
        console.error('ChatList: Error handling chat event:', error);
      }
    });

    return () => {
      console.log('ChatList: Cleaning up subscriptions');
      if (messageSubscription) unsubscribe(messageSubscription);
      if (chatEventSubscription) unsubscribe(chatEventSubscription);

    };
  }, [connected, currentUser, subscribe, unsubscribe, updateChatLastMessage, chats, setChats]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        // Load more chats when near bottom
        // Implement your load more logic here
      }
    }
  };

  const filteredChats = chats.filter(chat => {
    const searchLower = searchQuery.toLowerCase();
    return (
      chat?.name?.toLowerCase().includes(searchLower) ||
      chat?.participants?.some(p => 
        p?.fullName?.toLowerCase().includes(searchLower) && p?.id !== currentUser?.id
      ) ||
      chat?.lastMessage?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="chat-list-wrapper d-flex flex-column">
      <div className="chat-list-header p-2 border-bottom">
        <InputGroup className="mb-2">
          <InputGroup.Text className="bg-light border-end-0 py-1">
            <FiSearch />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search..."
            className="border-start-0 bg-light py-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroup.Text className="bg-light border-start-0 py-1">
            <FiFilter />
          </InputGroup.Text>
        </InputGroup>

        {showFilter && (
          <div className="px-2 py-1">
            <div className="flex flex-wrap gap-1">
              <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                All
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                Unread
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                Groups
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                Channels
              </button>
            </div>
          </div>
        )}
      </div>

      <div 
        className="chat-list-container flex-grow-1 overflow-auto"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {filteredChats.map((chat) => {
          const otherParticipant = chat?.participants?.find(p => p?.id !== currentUser?.id);
          const userStatus = otherParticipant?.status;

          return (
            <div key={chat.id} className="chat-item-wrapper">
              <ChatItem
                key={chat.id}
                chat={chat}
                chatId={chat.id}
                isSelected={currentChat?.id === chat.id}
                onClick={() => selectChat(chat)}
                userStatus={userStatus}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;