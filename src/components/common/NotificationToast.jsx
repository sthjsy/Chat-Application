import React, { useState } from 'react';
import { FaUserCircle, FaPaperPlane } from 'react-icons/fa';
import './NotificationToast.css';

const NotificationToast = ({ user, message, onNotificationClick, onReply, closeToast }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      onReply(replyText.trim());
      closeToast();
    }
  };

  return (
    <div className="notification-toast">
      <div 
        className="notification-toast-main" 
        onClick={(e) => {
          if (!isReplying) {
            onNotificationClick();
            closeToast();
          }
        }}
      >
        <div className="notification-toast-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <FaUserCircle size={40} />
          )}
        </div>
        <div className="notification-toast-content">
          <div className="notification-toast-user">{user.name}</div>
          <div className="notification-toast-message">{message}</div>
        </div>
      </div>
      
      {isReplying ? (
        <form className="notification-toast-reply-form" onSubmit={handleReplySubmit}>
          <input
            type="text"
            placeholder="Type a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <button type="submit" disabled={!replyText.trim()}>
            <FaPaperPlane />
          </button>
        </form>
      ) : (
        <div className="notification-toast-actions">
          <button 
            className="notification-toast-reply-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsReplying(true);
            }}
          >
            Reply
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationToast;