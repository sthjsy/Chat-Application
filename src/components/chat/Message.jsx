import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { FiMoreVertical, FiEdit2, FiTrash2, FiSmile, FiFile } from 'react-icons/fi';
import { FaCheck, FaCheckDouble, FaEllipsisV, FaDownload, FaPlay, FaPause } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import { MessageType } from '../../constants/messageTypes';

const Message = ({ message, onEdit, onDelete, onReact, onRemoveReaction, onEditReaction, messageType = MessageType.TEXT }) => {
  const { currentUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const audioRef = useRef(null);
  const messageRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // console.log('Message component mounted:', {
    //   messageId: message.id,
    //   type: messageType,
    //   senderId: message.senderId,
    //   content: message.content,
    //   attachments: message.attachments
    // });

    return () => {
      // console.log('Message component unmounting:', message.id);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [message, messageType]);

  // Add click outside handler for emoji picker
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

  const handleEdit = () => {
    console.log('Starting edit for message:', message.id);
    setIsEditing(true);
    setShowOptions(false);
  };

  const handleSaveEdit = async () => {
    try {
      console.log('Saving edited message:', {
        messageId: message.id,
        newContent: editedContent
      });
      await onEdit(message.id, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving edited message:', error);
      // You might want to show an error toast here
    }
  };

  const handleDelete = async () => {
    try {
      console.log('Deleting message:', message.id);
      await onDelete(message.id);
      setShowOptions(false);
    } catch (error) {
      console.error('Error deleting message:', error);
      // You might want to show an error toast here
    }
  };

  const handleAudioPlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      console.log('Pausing audio:', message.id);
      audioRef.current.pause();
    } else {
      console.log('Playing audio:', message.id);
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(progress);
  };

  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting message time:', error);
      return '';
    }
  };

  const handleReactionClick = async (emoji) => {
    if (!message?.id) {
      console.error('Message ID is required for reaction');
      return;
    }

    try {
      console.log('Handling reaction click:', { messageId: message.id, emoji });
      
      // Find if user has already reacted to this message
      const userReaction = message.reactions?.find(r => r.userId === currentUser.id);
      
      if (userReaction) {
        if (userReaction.emoji === emoji) {
          // Remove reaction if clicking the same emoji
          console.log('Removing reaction:', { messageId: message.id, emoji });
          await onRemoveReaction(message.id, emoji);
        } else {
          // Edit reaction if clicking a different emoji
          console.log('Editing reaction:', { 
            messageId: message.id, 
            oldEmoji: userReaction.emoji, 
            newEmoji: emoji 
          });
          await onEditReaction(message.id, userReaction.emoji, emoji);
        }
      } else {
        // Add new reaction
        console.log('Adding new reaction:', { messageId: message.id, emoji });
        await onReact(message.id, emoji);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      // You might want to show an error toast here
    }
  };

  const getReactionTooltip = (reaction) => {
    if (!reaction || !reaction.users) return '';
    
    const userNames = reaction.users
      .map(user => user.fullName || user.username)
      .join(', ');
    return `${reaction.emoji} ${userNames}`;
  };

  const handleEmojiButtonClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Calculate position for the emoji picker
    const pickerWidth = 300;
    const pickerHeight = 400;
    
    // Position the picker above the button
    const top = Math.max(0, rect.top - pickerHeight - 10);
    const left = Math.max(0, rect.right - pickerWidth);
    
    console.log('Setting emoji picker position:', { top, left, rect });
    setEmojiPickerPosition({ top, left });
    setShowEmojiPicker(true);
  };

  const renderMessageContent = () => {
    // console.log('Rendering message content:', {
    //   type: messageType,
    //   hasAttachments: !!message.attachments?.length
    // });

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
            <button className="btn btn-sm btn-primary me-2" onClick={handleSaveEdit}>
              Save
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      );
    }

    switch (messageType) {
      case MessageType.IMAGE:
        return (
          <div className="message-image-container">
            <img
              src={message.attachments[0]}
              alt="Message attachment"
              className="rounded max-w-[200px] max-h-[200px] cursor-pointer"
              onClick={() => window.open(message.attachments[0], '_blank')}
              onError={(e) => {
                console.error('Error loading image:', e);
                e.target.src = '/placeholder-image.png'; // Add a placeholder image
              }}
            />
            {message.content && <p className="mt-2">{message.content}</p>}
          </div>
        );

      case MessageType.VIDEO:
        return (
          <div className="message-video-container">
            <video
              controls
              className="rounded max-w-[200px]"
              onError={(e) => console.error('Error loading video:', e)}
            >
              <source src={message.attachments[0]} />
              Your browser does not support the video tag.
            </video>
            {message.content && <p className="mt-2">{message.content}</p>}
          </div>
        );

      case MessageType.AUDIO:
        return (
          <div className="message-audio-container">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-sm btn-primary me-2"
                onClick={handleAudioPlayPause}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <div className="progress flex-grow-1">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <audio
                ref={audioRef}
                src={message.attachments[0]}
                onTimeUpdate={handleAudioTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => console.error('Error loading audio:', e)}
              />
            </div>
            {message.content && <p className="mt-2">{message.content}</p>}
          </div>
        );

      case MessageType.FILE:
        return (
          <div className="message-file-container">
            <div className="d-flex align-items-center bg-light p-2 rounded">
              <FaDownload className="me-2" />
              <a
                href={message.attachments[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-none"
                onClick={() => console.log('File download clicked:', message.attachments[0])}
              >
                {message.content || 'Download file'}
              </a>
            </div>
          </div>
        );

      default:
        return <div className="message-text">{message.content}</div>;
    }
  };

  return (
    <div
      ref={messageRef}
      className={`message-container ${isOwnMessage ? 'own-message' : 'received-message'}`}
      data-message-id={message.id}
    >
      <div className="message-header">
        <span className="sender-name small">
          {isOwnMessage ? 'You' : message.senderProfileName}
        </span>
        <span className="message-time small">{formatTime(message.createdAt)}</span>
      </div>

      <div className="message-content">
        {renderMessageContent()}
      </div>

      <div className="message-footer">
        <div className="message-reactions">
          {message.reactions?.map((reaction, index) => (
            <span 
              key={`${reaction.emoji}-${index}`}
              className={`reaction-bubble ${reaction.userId === currentUser.id ? 'own-reaction' : ''}`}
              onClick={() => handleReactionClick(reaction.emoji)}
              onMouseEnter={() => setHoveredReaction(reaction)}
              onMouseLeave={() => setHoveredReaction(null)}
              title={getReactionTooltip(reaction)}
            >
              <span className="reaction-emoji">{reaction.emoji}</span>
              {reaction.count > 1 && (
                <span className="reaction-count">{reaction.count}</span>
              )}
              {hoveredReaction?.emoji === reaction.emoji && (
                <div className="reaction-tooltip">
                  {getReactionTooltip(reaction)}
                </div>
              )}
            </span>
          ))}
        </div>
        
        <div className="message-actions">
          {isOwnMessage && (
            <>
              <button className="action-btn" onClick={() => setIsEditing(true)}>
                <FiEdit2 />
              </button>
              <button className="action-btn" onClick={() => onDelete(message.id)}>
                <FiTrash2 />
              </button>
            </>
          )}
          <button 
            ref={emojiButtonRef}
            className="action-btn" 
            onClick={handleEmojiButtonClick}
            type="button"
          >
            <FiSmile />
          </button>
        </div>
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
              console.log('Emoji selected:', emojiObject);
              handleReactionClick(emojiObject.emoji);
              setShowEmojiPicker(false);
            }}
            width={300}
            height={400}
            searchPlaceholder="Search emoji..."
            skinTonesDisabled={true}
            lazyLoadEmojis={true}
            previewConfig={{
              showPreview: false
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Message; 