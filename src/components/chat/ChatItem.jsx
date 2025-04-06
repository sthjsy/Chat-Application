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
    if (!chat.participants || chat.participants.length === 0) return null;
    
    // For group chats, show online count
    if (chat.chatType === 'GROUP') {
      const onlineCount = chat.participants.filter(p => p.status === 'ONLINE').length;
      return onlineCount > 0 ? `${onlineCount} online` : null;
    }
    
    // For private chats, show status of the other participant
    const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
    if (otherParticipant) {
      return otherParticipant.status || null;
    }
    
    return null;
  };

  const renderReactions = () => {
    if (!chat.lastMessageReactions || chat.lastMessageReactions.length === 0) {
      return null;
    }

    return (
      <div className="message-reactions">
        {chat.lastMessageReactions.map((reaction, index) => (
          <span key={index} className="reaction-badge">
            {reaction.emoji} {reaction.count > 1 ? reaction.count : ''}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      onClick={() => onClick(chat)}
      className={`chat-item ${isSelected ? 'selected' : ''}`}
    >
      <div className="d-flex align-items-center">
        <div className="position-relative me-2">
          {chat.avatar ? (
            <img 
              src={chat.avatar} 
              alt={getChatName()} 
              className="chat-avatar rounded-circle"
              width="40"
              height="40"
            />
          ) : (
            <FaUserCircle size={40} />
          )}
          {chat.chatType === 'PRIVATE' && (
            <span
              className="position-absolute bottom-0 end-0 rounded-circle"
              style={{ width: "10px", height: "10px", backgroundColor: getStatusColor() }}
            ></span>
          )}
        </div>
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-center">
            <span className="chat-name fw-bold">{getChatName()}</span>
            <span className="chat-time text-muted small">{getLastMessageTime()}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center message-preview">
              <small className="text-muted text-truncate">
                {getLastMessageSender()}: {getLastMessagePreview()}
                {renderReactions()}
              </small>
            </div>
            <div className="d-flex align-items-center message-meta">
              {getMessageStatus()}
              {getUnreadCount() && (
                <span className="badge bg-primary rounded-pill ms-2">
                  {getUnreadCount()}
                </span>
              )}
            </div>
          </div>
          {chat.chatType === 'GROUP' && (
            <div className="chat-participants small text-muted">
              {getParticipantStatus()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatItem;