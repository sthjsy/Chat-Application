// ChatList.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { websocketService } from '../../services/websocketService';
import ChatItem from './ChatItem';
import { FiSearch, FiPlus, FiFilter } from 'react-icons/fi';
import { Form, InputGroup } from 'react-bootstrap';
import chatService from '../../services/chatService';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const scrollRef = useRef(null);

  // Set up WebSocket event handlers
  useEffect(() => {
    if (!currentUser) return;

    // Handle new messages
    websocketService.onNewMessage((message) => {
      console.log('ChatList received message:', message);
      
      // Update the chat's last message and move it to top
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

        // Find the updated chat
        const updatedChat = updatedChats.find(chat => chat.id === message.chatId);
        
        // Move the updated chat to the top
        if (updatedChat) {
          const filteredChats = updatedChats.filter(chat => chat.id !== message.chatId);
          return [updatedChat, ...filteredChats];
        }

        return updatedChats;
      });

      // If this is a new chat, add it to the list
      if (!chats.some(chat => chat.id === message.chatId)) {
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
    });

    // Handle new chats
    websocketService.onNewChat((chat) => {
      console.log('ChatList received new chat:', chat);
      setChats(prev => [chat, ...prev]);
    });

    // Handle chat updates
    websocketService.onChatUpdate((updatedChat) => {
      console.log('ChatList received chat update:', updatedChat);
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
    });

    // Handle user status changes
    websocketService.onUserStatusChange((userId, status) => {
      console.log('ChatList received user status change:', { userId, status });
      // Update user status in the chat list
      setChats(prev => prev.map(chat => {
        if (chat.participants?.some(p => p.id === userId)) {
          return {
            ...chat,
            participants: chat.participants.map(p => 
              p.id === userId ? { ...p, status } : p
            )
          };
        }
        return chat;
      }));
    });

    return () => {
      // Clean up WebSocket handlers
      websocketService.onNewMessage(null);
      websocketService.onNewChat(null);
      websocketService.onChatUpdate(null);
      websocketService.onUserStatusChange(null);
    };
  }, [currentUser, currentChat, chats]);

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