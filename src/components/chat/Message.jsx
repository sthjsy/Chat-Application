import React, { useState, useEffect, useRef } from 'react';
import { FiEdit2, FiTrash2, FiSmile } from 'react-icons/fi';
import { FaCheck, FaCheckDouble, FaDownload, FaPlay, FaPause } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import { MessageType } from '../../constants/messageTypes';
import {
  formatMessageTimeShort,
  formatReadTimestamp,
  getLatestReadAt,
  getMessageTimestamp,
  getReadEntries,
  getUnreadEntries,
  isMessageRead
} from '../../utils/messageUtils';

const Message = ({ message, onEdit, onDelete, onReact, onRemoveReaction, onEditReaction, messageType = MessageType.TEXT }) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showReadTooltip, setShowReadTooltip] = useState(false);
  const audioRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [message, messageType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiButtonRef.current && !emojiButtonRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const isOwnMessage = message.senderId === currentUser.id;
  const excludeUserIds = [currentUser.id, message.senderId].filter(Boolean);
  const readUsers = getReadEntries(message, { excludeUserIds });
  const unreadUsers = getUnreadEntries(message, { excludeUserIds });
  const latestReadAt = getLatestReadAt(message, excludeUserIds);
  const hasReactions = message.reactions?.length > 0;
  const sentTime = formatMessageTimeShort(getMessageTimestamp(message));
  const readTooltipTitle = latestReadAt ? formatReadTimestamp(latestReadAt) : 'Sent';

  const handleSaveEdit = async () => {
    try {
      await onEdit(message.id, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving edited message:', error);
    }
  };

  const handleReactionClick = async (emoji) => {
    if (!message?.id) return;

    try {
      const userReaction = message.reactions?.find(r => r.userId === currentUser.id);

      if (userReaction) {
        if (userReaction.emoji === emoji) {
          await onRemoveReaction(message.id, emoji);
        } else {
          await onEditReaction(message.id, userReaction.emoji, emoji);
        }
      } else {
        await onReact(message.id, emoji);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const getReactionTooltip = (reaction) => {
    if (!reaction?.users) return '';
    const userNames = reaction.users.map(user => user.fullName || user.username).join(', ');
    return `${reaction.reactionType || reaction.emoji} ${userNames}`;
  };

  const handleEmojiButtonClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    setEmojiPickerPosition({
      top: Math.max(0, rect.top - 410),
      left: Math.max(0, rect.right - 300)
    });
    setShowEmojiPicker(true);
  };

  const renderMessageContent = () => {
    if (isEditing) {
      return (
        <div className="edit-container">
          <input
            type="text"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="form-control"
            autoFocus
          />
          <div className="mt-2">
            <button className="btn btn-sm btn-primary me-2" onClick={handleSaveEdit}>Save</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      );
    }

    switch (messageType) {
      case MessageType.IMAGE:
        return (
          <div className="message-media">
            <img
              src={message.attachments[0]}
              alt="Message attachment"
              className="message-image"
              onClick={() => window.open(message.attachments[0], '_blank')}
              onError={(e) => { e.target.src = '/placeholder-image.png'; }}
            />
            {message.content && <div className="message-text">{message.content}</div>}
          </div>
        );
      case MessageType.VIDEO:
        return (
          <div className="message-media">
            <video controls className="message-video">
              <source src={message.attachments[0]} />
            </video>
            {message.content && <div className="message-text">{message.content}</div>}
          </div>
        );
      case MessageType.AUDIO:
        return (
          <div className="message-media">
            <div className="d-flex align-items-center">
              <button className="btn btn-sm btn-primary me-2" type="button" onClick={() => {
                if (!audioRef.current) return;
                if (isPlaying) audioRef.current.pause();
                else audioRef.current.play();
                setIsPlaying(!isPlaying);
              }}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <div className="progress flex-grow-1">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <audio
                ref={audioRef}
                src={message.attachments[0]}
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
                  }
                }}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
            {message.content && <div className="message-text">{message.content}</div>}
          </div>
        );
      case MessageType.FILE:
        return (
          <div className="message-media">
            <a href={message.attachments[0]} target="_blank" rel="noopener noreferrer" className="message-file-link">
              <FaDownload /> {message.content || 'Download file'}
            </a>
          </div>
        );
      default:
        return <span className="message-text">{message.content}</span>;
    }
  };

  const renderReadTooltip = () => {
    if (!showReadTooltip || !isOwnMessage) return null;
    if (readUsers.length === 0 && unreadUsers.length === 0 && !latestReadAt) return null;

    return (
      <div className="read-status-tooltip">
        {readUsers.length > 0 ? (
          <>
            <div className="tooltip-header">Read by</div>
            {readUsers.map((user) => (
              <div key={user.userId} className="tooltip-user">
                <span className="tooltip-user-name">{user.name}</span>
                <span className="tooltip-time">{formatReadTimestamp(user.readAt)}</span>
              </div>
            ))}
          </>
        ) : (
          <div className="tooltip-user">
            <span className="tooltip-user-name">{readTooltipTitle}</span>
          </div>
        )}
        {unreadUsers.length > 0 && (
          <div className="unread-users">
            <div className="tooltip-header">Not read yet</div>
            {unreadUsers.map((user) => (
              <div key={user.userId} className="tooltip-user">
                <span className="tooltip-user-name">{user.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`message-container ${isOwnMessage ? 'own-message' : 'received-message'} ${isHovered ? 'is-hovered' : ''}`}
      data-message-id={message.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowReadTooltip(false);
      }}
    >
      <div className="message-stack">
        {!isOwnMessage && message.senderProfileName && (
          <div className="message-sender-label">{message.senderProfileName}</div>
        )}

        <div className="message-bubble-row">
          <div className={`message-hover-actions ${isHovered ? 'is-visible' : ''}`}>
            {isOwnMessage && (
              <>
                <button className="action-btn" type="button" onClick={() => setIsEditing(true)} title="Edit">
                  <FiEdit2 />
                </button>
                <button className="action-btn" type="button" onClick={() => onDelete(message.id)} title="Delete">
                  <FiTrash2 />
                </button>
              </>
            )}
            <button
              ref={emojiButtonRef}
              className="action-btn"
              type="button"
              onClick={handleEmojiButtonClick}
              title="React"
            >
              <FiSmile />
            </button>
          </div>

          <div className="message-content">
            <div className="message-content-body">
              {renderMessageContent()}
              {!isEditing && (
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
              )}
            </div>
            {renderReadTooltip()}
          </div>
        </div>

        {hasReactions && (
          <div className="message-reactions">
            {message.reactions.map((reaction, index) => (
              <span
                key={`${reaction.reactionType}-${index}`}
                className={`reaction-bubble ${reaction.users?.some(u => u.id === currentUser.id) ? 'own-reaction' : ''}`}
                onClick={() => handleReactionClick(reaction.reactionType)}
                onMouseEnter={() => setHoveredReaction(reaction)}
                onMouseLeave={() => setHoveredReaction(null)}
                title={getReactionTooltip(reaction)}
              >
                <span className="reaction-emoji">{reaction.reactionType}</span>
                {reaction.count > 1 && <span className="reaction-count">{reaction.count}</span>}
                {hoveredReaction?.reactionType === reaction.reactionType && (
                  <div className="reaction-tooltip">{getReactionTooltip(reaction)}</div>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {showEmojiPicker && (
        <div
          className="emoji-picker-wrapper"
          style={{
            position: 'fixed',
            top: emojiPickerPosition.top,
            left: emojiPickerPosition.left,
            zIndex: 9999
          }}
        >
          <EmojiPicker
            onEmojiClick={(emojiObject) => {
              handleReactionClick(emojiObject.emoji);
              setShowEmojiPicker(false);
            }}
            width={300}
            height={400}
            searchPlaceholder="Search emoji..."
            skinTonesDisabled
            lazyLoadEmojis
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
};

export default Message;
