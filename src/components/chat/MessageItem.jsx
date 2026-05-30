import React, { useState } from 'react';
import { FaCheck, FaCheckDouble } from 'react-icons/fa';
import {
  formatMessageTimeShort,
  formatReadTimestamp,
  getLatestReadAt,
  getMessageTimestamp,
  getReadEntries,
  isMessageRead
} from '../../utils/messageUtils';

const MessageItem = ({ message, isOwnMessage, currentUserId }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showReadTooltip, setShowReadTooltip] = useState(false);

  const excludeUserIds = [currentUserId, message.senderId, message.sender?.id].filter(Boolean);
  const readUsers = getReadEntries(message, { excludeUserIds });
  const latestReadAt = getLatestReadAt(message, excludeUserIds);
  const sentTime = formatMessageTimeShort(getMessageTimestamp(message));
  const readTooltipTitle = latestReadAt ? formatReadTimestamp(latestReadAt) : 'Sent';

  const senderName = message.sender?.name || message.sender?.fullName || message.senderProfileName || 'User';
  const senderInitial = senderName.charAt(0).toUpperCase();

  const renderReadTooltip = () => {
    if (!showReadTooltip || !isOwnMessage || readUsers.length === 0) return null;

    return (
      <div className="read-status-tooltip">
        <div className="tooltip-header">Read by</div>
        {readUsers.map((user) => (
          <div key={user.userId} className="tooltip-user">
            <span className="tooltip-user-name">{user.name}</span>
            <span className="tooltip-time">{formatReadTimestamp(user.readAt)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`message-container ${isOwnMessage ? 'own-message' : 'received-message'} ${isHovered ? 'is-hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowReadTooltip(false);
      }}
    >
      <div className="message-stack">
        {!isOwnMessage && (
          <div className="message-sender-label">{senderName}</div>
        )}

        <div className="message-bubble-row">
          {!isOwnMessage && (
            <div className="message-item-avatar">
              {message.sender?.avatar ? (
                <img src={message.sender.avatar} alt={senderName} className="message-item-avatar-img" />
              ) : (
                <div className="message-item-avatar-fallback">{senderInitial}</div>
              )}
            </div>
          )}

          <div className="message-content">
            <div className="message-content-body">
              <span className="message-text">{message.content}</span>
              <div className="message-meta">
                <span className="message-time">{sentTime}</span>
                {isOwnMessage && (
                  <span
                    className={`message-read-indicator ${isMessageRead(message) ? 'is-read' : 'is-sent'}`}
                    title={readTooltipTitle}
                    onMouseEnter={() => setShowReadTooltip(true)}
                    onMouseLeave={() => setShowReadTooltip(false)}
                  >
                    {isMessageRead(message) ? <FaCheckDouble size={11} /> : <FaCheck size={11} />}
                  </span>
                )}
              </div>
            </div>
            {renderReadTooltip()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
