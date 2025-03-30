// ChatList.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
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
  const { subscribe, unsubscribe, connected } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!connected || !currentUser?.id) return;

    console.log('Setting up chat list message subscription');

    // Subscribe to user-specific messages for all chats
    const messageSubscription = subscribe(`/user/${currentUser.id}/queue/messages`, (message) => {
      try {
        const messageData = JSON.parse(message.body);
        console.log('ChatList received message:', messageData);
        
        // Update the chat's last message
        updateChatLastMessage(messageData.chatId, {
          content: messageData.content,
          timestamp: messageData.timestamp,
          senderId: messageData.senderId
        });

        // If this is a new chat, add it to the list
        if (!chats.some(chat => chat.id === messageData.chatId)) {
          chatService.getChat(messageData.chatId)
            .then(newChat => {
              if (newChat) {
                setChats(prev => [newChat, ...prev]);
              }
            })
            .catch(error => {
              console.error('Error fetching new chat:', error);
            });
        }
      } catch (error) {
        console.error('Error handling message in ChatList:', error);
      }
    });

    // Subscribe to chat events
    const chatEventSubscription = subscribe(`/user/${currentUser.id}/queue/chat.events`, (event) => {
      try {
        const eventData = JSON.parse(event.body);
        console.log('ChatList received chat event:', eventData);
        
        if (eventData.type === 'NEW_CHAT') {
          // Add new chat to the top of the list
          setChats(prev => [eventData.chat, ...prev]);
        } else if (eventData.type === 'CHAT_UPDATE') {
          // Update existing chat and move it to the top
          setChats(prev => {
            const updatedChats = prev.map(chat => 
              chat.id === eventData.chat.id ? eventData.chat : chat
            );
            const updatedChat = updatedChats.find(chat => chat.id === eventData.chat.id);
            if (updatedChat) {
              const filteredChats = updatedChats.filter(chat => chat.id !== eventData.chat.id);
              return [updatedChat, ...filteredChats];
            }
            return updatedChats;
          });
        }
      } catch (error) {
        console.error('Error handling chat event in ChatList:', error);
      }
    });

    return () => {
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