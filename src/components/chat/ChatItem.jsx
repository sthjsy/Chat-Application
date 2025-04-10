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
    
    if (chat.chatType === 'PRIVATE') {
      // For private chats, show the other participant's name
      const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
      return otherParticipant ? otherParticipant.fullName : 'Unknown User';
    } else {
      // For group chats, show the group name
      return chat.chatName;
    }
  };

  const getChatUsername = () => {
    if (!chat) return '';
    
    if (chat.chatType === 'PRIVATE') {
      const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
      return otherParticipant ? otherParticipant.username : '';
    }
    return '';
  };

  const getLastMessagePreview = () => {
    if (!chat?.lastMessage) return 'No messages yet';
    
    // Truncate long messages
    const maxLength = 15;
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
    if (!chat?.lastMessageSenderId) return '';
    
    // If the sender is the current user
    if (chat.lastMessageSenderId === currentUser.id) return 'You';
    
    // Find the sender in participants
    const sender = chat.participants.find(p => p.id === chat.lastMessageSenderId);
    return sender ? sender.fullName.split(' ')[0] : '';
  };

  const getMessageStatus = () => {
    if (!chat?.lastMessage) return null;
    
    const isLastMessageFromCurrentUser = chat.lastMessageSenderId === currentUser.id;
    if (!isLastMessageFromCurrentUser) return null;
    
    // Check if the message has been read (no unread count)
    if (chat.totalUnreadCount === 0) {
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
      case 'BUSY':
        return '#F44336';
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
    if (!chat.totalUnreadCount) return null;
      return chat.totalUnreadCount > 9 ? '9+' : chat.totalUnreadCount;
  };

  const getParticipantStatus = () => {
    if (chat.chatType === 'PRIVATE') {
      // For private chats, show the other participant's status
      const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
      if (!otherParticipant) return null;
      
      const status = userStatuses[otherParticipant.id];
      return status ? (
        <span className="user-status" style={{ color: getStatusColor() }}>
          {getStatusText()}
        </span>
      ) : null;
    } else {
      // For group chats, show the number of online participants
      const onlineCount = chat.participants.filter(p => 
        p.id !== currentUser.id && userStatuses[p.id] === 'ONLINE'
      ).length;
      
      return onlineCount > 0 ? (
        <span className="user-status">
          {onlineCount} online
        </span>
      ) : null;
    }
  };

  const renderReactions = () => {
    if (!chat?.lastMessageReactions || chat.lastMessageReactions.length === 0) return null;
    
    return (
      <div className="message-reactions small">
        {chat.lastMessageReactions.map((reaction, index) => (
          <span key={index} className="reaction-bubble" title={`${reaction.count} reactions`}>
            <span className="reaction-emoji">{reaction.emoji}</span>
            <span className="reaction-count">{reaction.count}</span>
          </span>
        ))}
      </div>
    );
  };

  // Check if this is a draft chat
  const isDraft = chat?.isDraft === true;
  
  return (
    <div 
      className={`chat-item ${isSelected ? 'selected' : ''} ${isDraft ? 'draft' : ''}`}
      onClick={onClick}
    >
      <div className="d-flex align-items-center">
        <div className="position-relative">
          <FaUserCircle size={28} />
          {!isDraft && getParticipantStatus() && (
            <span 
              className="position-absolute status-dot" 
              style={{ 
                backgroundColor: getStatusColor(),
                bottom: 0,
                right: 0
              }}
            ></span>
          )}
        </div>
        <div className="ms-2 flex-grow-1">
          <div className="d-flex justify-content-between align-items-center">
            <div className="chat-name">{getChatName()}</div>
            <div className="message-meta">
              <small className="text-muted">{getLastMessageTime()}</small>
              {getMessageStatus()}
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <div className="message-preview">
              {isDraft ? (
                <small className="text-muted">Draft chat - Click to start messaging</small>
              ) : (
                <>
                  <small className="text-muted">
                    {getLastMessageSender() && `${getLastMessageSender()}: `}
                  </small>
                  <small>{getLastMessagePreview()}</small>
                </>
              )}
            </div>
            {getUnreadCount() && (
              <span className="badge bg-primary rounded-pill">{getUnreadCount()}</span>
            )}
          </div>
          {renderReactions()}
        </div>
      </div>
    </div>
  );
};

export default ChatItem;