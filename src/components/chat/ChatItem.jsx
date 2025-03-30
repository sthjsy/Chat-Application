// ChatItem.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';
import { FaUserCircle, FaSearch, FaVideo, FaPhone, FaSmile, FaPaperclip, FaPaperPlane, FaBell, FaCommentDots, FaCalendarAlt, FaPhoneAlt, FaFileAlt, FaCheck, FaCheckDouble } from "react-icons/fa";
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';

const ChatItem = ({ chat, isSelected, onClick, userStatus }) => {
  const { currentUser } = useAuth();
  const { 
    currentChat, 
    messages,
    setMessages,
    addMessage,
    loading, 
    error, 
    setError,
    setCurrentChat,
    setUnreadCounts,
    userStatuses
  } = useChat();

  const [chatId, setChatId] = useState(currentChat?.id);

  useEffect(() => {
    if (currentChat?.id && !chatId) {
      setChatId(currentChat.id);
      console.log("Setting chatId from currentChat:", currentChat.id);
    }
  }, [currentChat, chatId]);

  const getChatName = () => {
    if (!chat) return 'Unknown';
    if(chat.chatType)
    {
      if(chat.chatType === 'PRIVATE')
      {
        if(chat.participants[0].id === currentUser.id)  return chat.participants[1].fullName;
        else  return chat.participants[0].fullName;
      }
      else  return chat.chatName;
    }
    else  return 'Unknown Chat';
  };

  const getChatUsername = () => {
    if (!chat) return '';
    if(chat.chatType === 'PRIVATE')
    {
      if(chat.participants[0].id === currentUser.id)  return chat.participants[1].username;
      else  return chat.participants[0].username;
    }
    return '';
  };

  const getLastMessagePreview = () => {
    if (!chat?.lastMessage) return 'No messages yet';
    
    // Truncate long messages
    const maxLength = 15; // Reduced max length to accommodate time
    const content = chat.lastMessage;
    return content.length > maxLength 
      ? `${content.substring(0, maxLength)}...` 
      : content;
  };

  const getLastMessageTime = () => {
    if (!chat?.lastMessageTime) return '';
    return formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: true });
  };

  const getLastMessageSender = () => {
    if (!chat?.lastMessageSender) return '';
    if (chat.lastMessageSender === currentUser.fullName) return 'You';
    
    return chat.lastMessageSender;
  };

  const getMessageStatus = () => {
    if (!chat?.lastMessage) return null;
    
    const isLastMessageFromCurrentUser = chat.lastMessageSenderId === currentChat?.currentUser?.id;
    if (!isLastMessageFromCurrentUser) return null;
    
    if (chat.lastMessageRead) {
      return <FiCheckCircle className="message-status read" />;
    }
    
    return <FiCheck className="message-status sent" />;
  };

  const getStatusColor = () => {
    if (!userStatus) return '#9E9E9E';
    switch (userStatus.toUpperCase()) {
      case 'ONLINE':
        return '#4CAF50';
      case 'AWAY':
        return '#FFC107';
      case 'OFFLINE':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    if (!userStatus) return 'Offline';
    // Convert status to title case (e.g., "ONLINE" -> "Online")
    return userStatus.charAt(0).toUpperCase() + userStatus.slice(1).toLowerCase();
  };

  const getUnreadCount = () => {
    if (!chat.unreadCount) return null;
    return chat.unreadCount > 99 ? '99+' : chat.unreadCount;
  };

  const getParticipantStatus = () => {
    if (!chat.participants || chat.participants.length === 0) return null;
    
    // For group chats, show online count
    if (chat.type === 'GROUP' || chat.type === 'CHANNEL') {
      const onlineCount = chat.participants.filter(p => userStatuses[p.id] === 'ONLINE').length;
      return onlineCount > 0 ? `${onlineCount} online` : null;
    }
    
    // For private chats, show status of the other participant
    const otherParticipant = chat.participants.find(p => p.id !== currentChat?.currentUser?.id);
    if (otherParticipant) {
      return userStatuses[otherParticipant.id] || null;
    }
    
    return null;
  };

  return (
    <div
      onClick={() => onClick(chat)}
      className={`chat-item ${isSelected ? 'selected' : ''}`}
    >
      <div className="d-flex align-items-center">
        <div className="position-relative me-2">
          <FaUserCircle size={28} />
          <span
            className="position-absolute bottom-0 end-0 rounded-circle"
            style={{ width: "8px", height: "8px", backgroundColor: getStatusColor() }}
          ></span>
        </div>
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-center">
            <span className="chat-name">{getChatName()}</span>
            {chat?.chatType === 'PRIVATE' && (
              <span className="chat-username">@{getChatUsername()}</span>
            )}
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center message-preview">
              <small className="text-muted text-truncate">
                {getLastMessageSender()}: {getLastMessagePreview()}
              </small>
            </div>
            <div className="d-flex align-items-center message-meta">
              <small className="text-muted ms-2">{getLastMessageTime()}</small>
              {getUnreadCount() && (
                <span className="badge bg-primary rounded-pill ms-2">
                  {getUnreadCount()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatItem;