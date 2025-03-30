import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { FaSearch, FaUserCircle, FaPaperclip, FaSmile, FaPaperPlane, FaTimes, FaUsers, FaCog } from 'react-icons/fa';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import Message from './Message';
import { useChat } from '../../contexts/ChatContext';
import { FiSend, FiPaperclip, FiSmile, FiVideo, FiPhone, FiMoreVertical, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { Container, Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import '../../styles/chat.css';
import chatService from '../../services/chatService';
import { MessageType } from '../../constants/messageTypes';
import { format, isSameDay } from 'date-fns';

const ChatWindow = () => {
  const { currentUser } = useAuth();
  const { 
    sendMessage, 
    sendTypingIndicator, 
    markMessagesAsRead,
    connected,
    subscribe,
    unsubscribe,
    userStatuses
  } = useSocket();
  const { 
    currentChat, 
    messages,
    setMessages,
    addMessage,
    loading, 
    error, 
    setError,
    handleAddReaction,
    handleRemoveReaction,
    handleEditReaction
  } = useChat();
  const [chatId, setChatId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [readReceipts, setReadReceipts] = useState({});
  const typingTimeoutRef = useRef({});
  const lastReadMessageRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messageInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const headerRef = useRef(null);

  // Single effect to handle chatId updates
  useEffect(() => {
    console.log('ChatWindow - currentChat changed:', currentChat);
    
    if (!currentChat) {
      console.log('No chat selected, clearing chatId');
      setChatId(null);
      return;
    }

    const newChatId = currentChat.id;
    console.log('Updating chatId:', {
      previousChatId: chatId,
      newChatId: newChatId,
      chatDetails: currentChat
    });

    // Clear messages when switching chats
    setMessages([]);
    setChatId(newChatId);
  }, [currentChat]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!connected || !chatId || !currentUser?.id) {
      console.log('Not subscribing to messages - prerequisites not met:', { 
        connected, 
        chatId, 
        userId: currentUser?.id 
      });
      return;
    }

    console.log('Setting up message subscriptions for chat:', chatId);

    // Subscribe to chat messages for current chat only
    const messageSubscription = subscribe(`/topic/chat/${chatId}`, (message) => {
      try {
        const messageData = JSON.parse(message.body);
        console.log('Received message for current chat:', messageData);
        
        // Only add message if it belongs to current chat
        if (messageData.chatId === chatId) {
          // Check if message already exists
          const messageExists = messages.some(m => m.id === messageData.id);
          if (!messageExists) {
            addMessage(messageData);
          }

          // Mark message as read if it's not from current user
          if (messageData.senderId !== currentUser.id) {
            markMessagesAsRead(chatId, [messageData.id]);
          }
        }
      } catch (error) {
        console.error('Error handling received message:', error);
      }
    });

    // Cleanup subscription
    return () => {
      console.log('Cleaning up message subscriptions for chat:', chatId);
      if (messageSubscription) unsubscribe(messageSubscription);
    };
  }, [connected, chatId, currentUser?.id, subscribe, unsubscribe, markMessagesAsRead, addMessage, messages]);

  // Track message visibility for read receipts
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId && (!lastReadMessageRef.current || messageId > lastReadMessageRef.current)) {
              lastReadMessageRef.current = messageId;
              // chatService.markAsRead(chatId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const messageElements = document.querySelectorAll('[data-message-id]');
    messageElements.forEach(element => observer.observe(element));

    return () => {
      messageElements.forEach(element => observer.unobserve(element));
    };
  }, [messages, chatId]);

  // Get typing indicator text
  const getTypingIndicatorText = () => {
    if (typingUsers.length === 0) return null;

    const typingUsernames = typingUsers.map(userId => {
      const user = currentChat?.participants?.find(p => p.id === userId);
      return user?.username || 'Someone';
    });

    if (typingUsernames.length === 1) {
      return `${typingUsernames[0]} is typing...`;
    } else if (typingUsernames.length === 2) {
      return `${typingUsernames[0]} and ${typingUsernames[1]} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };

  const handleMessageEdit = async (messageId, newContent) => {
    try {
      console.log('Editing message:', { messageId, newContent });
      const updatedMessage = await chatService.editMessage(chatId, messageId, newContent, 'TEXT');
      console.log('Message edited successfully:', updatedMessage);
      
      // Update message in local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
    } catch (error) {
      console.error('Error editing message:', error);
      setError('Failed to edit message');
    }
  };

  const handleMessageDelete = async (messageId) => {
    try {
      console.log('Deleting message:', messageId);
      await chatService.deleteMessage(messageId);
      console.log('Message deleted successfully');
      
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    try {
      let messageType = MessageType.TEXT;
      let content = newMessage.trim();

      // Determine message type based on attachments
      if (attachments.length > 0) {
        const firstFile = attachments[0];
        if (firstFile.type.startsWith('image/')) {
          messageType = MessageType.IMAGE;
          content = content || 'Sent an image';
        } else if (firstFile.type.startsWith('video/')) {
          messageType = MessageType.VIDEO;
          content = content || 'Sent a video';
        } else if (firstFile.type.startsWith('audio/')) {
          messageType = MessageType.AUDIO;
          content = content || 'Sent an audio message';
        } else {
          messageType = MessageType.FILE;
          content = content || 'Sent a file';
        }
      }

      console.log('Sending message:', { 
        chatId, 
        content, 
        messageType,
        attachments: attachments.length 
      });

      const message = await chatService.sendMessage(chatId, content, messageType);
      console.log('Message sent successfully:', message);
      
      // Add message to local state
      addMessage(message);
      
      // Clear input and attachments
      setNewMessage('');
      setAttachments([]);
      
      // Scroll to bottom
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  // Handle user search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    setShowSearchResults(true);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debouncing
    searchTimeoutRef.current = setTimeout(async () => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        console.log('Searching users with query:', query);
        const response = await axios.get(`/api/users/search/${query}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log('Search results:', response.data);
        setSearchResults(response.data);
      } catch (err) {
        console.error('Error searching users:', err);
        setError('Failed to search users');
      }
    }, 300); // 300ms debounce
  };

  // Handle user selection from search
  const handleUserSelect = async (user) => {
    try {
      console.log('Selected user:', user);
      
      // Check if private chat exists
      const existingChat = await chatService.getPrivateChat(user.id);
      
      if (existingChat) {
        console.log('Found existing chat:', existingChat);
        // Load existing chat
        setCurrentChat(existingChat);
      } else {
        console.log('Creating new private chat with user:', user.id);
        // Create new private chat
        const newChat = await chatService.createPrivateChat(user.id);
        console.log('Created new chat:', newChat);
        setCurrentChat(newChat);
      }
      
      // Clear search
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
    } catch (error) {
      console.error('Error handling user selection:', error);
      setError('Failed to start chat with user');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValid = 
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        file.type.startsWith('audio/') ||
        file.type === 'application/pdf' ||
        file.type === 'application/msword' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      if (!isValid) {
        console.warn(`Invalid file type: ${file.type}`);
      }
      return isValid;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle file attachment selection
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  // Handle paste events (e.g., for images)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    const files = [];
    
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          files.push(file);
        }
      }
      
      if (files.length > 0) {
        setAttachments(prev => [...prev, ...files]);
      }
    }
  };

  // Handle message input changes with typing indicator
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    // sendTypingIndicator(chatId, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      // sendTypingIndicator(chatId, false);
    }, 3000);
  };

  // Mark messages as read
  useEffect(() => {
    if (messages.length > 0) {
      const unreadMessages = messages
        .filter(msg => !msg.read && msg.senderId !== currentUser.id)
        .map(msg => msg.id);
      
      if (unreadMessages.length > 0) {
        markMessagesAsRead(chatId, unreadMessages);
      }
    }
  }, [messages, chatId, currentUser.id, markMessagesAsRead]);

  // Add this function to handle scroll behavior
  const scrollToMessage = (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Add auto-scroll when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
      const isScrolledToBottom = scrollHeight - clientHeight <= scrollTop + 100;
      
      if (isScrolledToBottom) {
        scrollToBottom();
      }
    }
  }, [messages]);

  // Fetch user details for private chats
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentChat || currentChat.chatType !== 'PRIVATE') {
        setUserDetails(null);
        return;
      }

      const otherParticipant = currentChat.participants.find(p => p.id !== currentUser.id);
      if (!otherParticipant) {
        setUserDetails(null);
        return;
      }

      setLoadingUserDetails(true);
      try {
        const response = await axios.get(`http://localhost:8082/api/users/${otherParticipant.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setUserDetails(response.data);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setUserDetails(null);
      } finally {
        setLoadingUserDetails(false);
      }
    };

    fetchUserDetails();
  }, [currentChat, currentUser.id]);

  // Handle click outside header dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowHeaderDropdown(false);
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentChat) {
    return (
      <div className="h-100 d-flex align-items-center justify-content-center">
        <p className="text-muted">Select a chat to start messaging</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const getInitial = (selectedChatItem) => {
    if (!selectedChatItem) return 'Unknown';
    if(selectedChatItem.chatType)
      if(selectedChatItem.chatType === 'PRIVATE')      
        if(selectedChatItem.participants[0].id === currentUser.id)
          return selectedChatItem.participants[1].fullName;
        else
          return selectedChatItem.participants[0].fullName;
      else 
        return selectedChatItem.chatName;
    else
      return 'Unknown Chat';
  };

  const formatMessageDate = (timestamp) => {
    try {
      // Check if timestamp is valid
      if (!timestamp) {
        console.warn('Invalid timestamp received:', timestamp);
        return '';
      }

      // Parse the timestamp
      const date = new Date(timestamp);
      
      // Validate the parsed date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date parsed from timestamp:', timestamp);
        return '';
      }

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (isSameDay(date, today)) {
        return 'Today';
      } else if (isSameDay(date, yesterday)) {
        return 'Yesterday';
      } else {
        return format(date, 'MMMM d, yyyy');
      }
    } catch (error) {
      console.error('Error formatting message date:', error, 'timestamp:', timestamp);
      return '';
    }
  };

  const getChatName = () => {
    if (!currentChat) return 'Select a chat';
    if(currentChat.chatType === 'PRIVATE')
    {
      if(currentChat.participants[0].id === currentUser.id)
        return currentChat.participants[1].fullName;
      else
        return currentChat.participants[0].fullName;
    }
    return currentChat.chatName;
  };

  const getChatUsername = () => {
    if (!currentChat || currentChat.chatType !== 'PRIVATE') return '';
    if(currentChat.participants[0].id === currentUser.id)
      return currentChat.participants[1].username;
    else
      return currentChat.participants[0].username;
  };

  const getStatusColor = () => {
    if (!currentChat || currentChat.chatType !== 'PRIVATE') return '#9E9E9E';
    const otherParticipant = currentChat.participants.find(p => p.id !== currentUser.id);
    const status = otherParticipant?.status;
    
    if (!status) return '#9E9E9E';
    switch (status.toUpperCase()) {
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
    if (!currentChat || currentChat.chatType !== 'PRIVATE') return '';
    const otherParticipant = currentChat.participants.find(p => p.id !== currentUser.id);
    const status = otherParticipant?.status;
    
    if (!status) return 'Offline';
    // Convert status to title case (e.g., "ONLINE" -> "Online")
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <div className="chat-window d-flex flex-column h-100" ref={headerRef}>
      {currentChat ? (
        <>
        
        {/* Current chat header */}
          <div 
            className="chat-header d-flex align-items-center justify-content-between py-2 px-3 border-bottom"
          >
            <div className="d-flex align-items-center">
              <div className="position-relative me-2">
                <FaUserCircle size={32} />
                <span
                  className="position-absolute bottom-0 end-0 rounded-circle"
                  style={{ width: "10px", height: "10px", backgroundColor: getStatusColor() }}
                ></span>
              </div>
              <div>
                <h6 className="mb-0">{getChatName()}</h6>
                {currentChat.chatType === 'PRIVATE' && (
                  <div className="d-flex align-items-center">
                    <span className="chat-username text-muted me-2">@{getChatUsername()}</span>
                    <span className="user-status" style={{ color: getStatusColor() }}>
                      {getStatusText()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Call buttons */}
            {currentChat.chatType === 'PRIVATE' && (
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-light btn-sm rounded-circle p-2"
                  title="Audio Call"
                  onClick={() => console.log('Start audio call')}
                >
                  <FiPhone size={16} />
                </button>
                <button 
                  className="btn btn-light btn-sm rounded-circle p-2"
                  title="Video Call"
                  onClick={() => console.log('Start video call')}
                >
                  <FiVideo size={16} />
                </button>
              </div>
            )}

            {/* Header Dropdown */}
            {showHeaderDropdown && (
              <div className="chat-header-dropdown">
                <div className="dropdown-item" onClick={() => setShowSearch(true)}>
                  <FiSearch className="me-2" /> Search Messages
                </div>
                <div className="dropdown-item" onClick={() => setShowUserDetails(true)}>
                  <FiUser className="me-2" /> View Profile
                </div>
                {currentChat?.chatType === 'GROUP' && (
                  <>
                    <div className="dropdown-item">
                      <FiSettings className="me-2" /> Group Settings
                    </div>
                    <div className="dropdown-item">
                      <FaUsers className="me-2" /> Group Info
                    </div>
                  </>
                )}
                <div className="dropdown-divider" />
                <div className="dropdown-item text-danger">
                  <FiLogOut className="me-2" /> Leave Chat
                </div>
              </div>
            )}
          </div>

          {/* Messages Area - Scrollable */}
          <div className="messages-container" ref={scrollRef}>
            {filteredMessages.map((message, index) => {
              // Add date divider if needed
              const showDateDivider = index === 0 || (
                message.timestamp && 
                filteredMessages[index - 1]?.timestamp &&
                !isSameDay(
                  new Date(message.timestamp),
                  new Date(filteredMessages[index - 1].timestamp)
                )
              );

              return (
                <React.Fragment key={message.id}>
                  {showDateDivider && message.timestamp && (
                    <div className="message-date-divider">
                      <span>
                        {formatMessageDate(message.timestamp)}
                      </span>
                    </div>
                  )}
                  <Message
                    message={message}
                    isOwnMessage={message.senderId === currentUser.id}
                    onEdit={handleMessageEdit}
                    onDelete={handleMessageDelete}
                    onReact={handleAddReaction}
                    onRemoveReaction={handleRemoveReaction}
                    onEditReaction={handleEditReaction}
                    messageType={message.messageType || MessageType.TEXT}
                    key={message.id}
                  />
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Section - Static */}
          <div className="message-input-section">
            {/* Attachment Preview */}
            {attachments.length > 0 && (
              <div className="d-flex gap-2 mb-2 p-2 bg-light rounded">
                {attachments.map((file, index) => (
                  <div key={index} className="position-relative">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="attachment"
                        className="rounded"
                        style={{ height: '40px', width: '40px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="bg-secondary rounded p-2 text-white">
                        <FiPaperclip />
                      </div>
                    )}
                    <button
                      className="position-absolute top-0 end-0 btn btn-sm btn-danger rounded-circle p-0"
                      style={{ width: '20px', height: '20px', fontSize: '12px' }}
                      onClick={() => removeAttachment(index)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="message-input-container position-relative">
              <Form onSubmit={handleSendMessage} className="message-input-form">
                <InputGroup>
                  <Button 
                    variant="light" 
                    className="border d-flex align-items-center"
                    onClick={handleAttachmentClick}
                    title="Attach files"
                  >
                    <FiPaperclip />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                      style={{ display: 'none' }}
                    />
                  </Button>

                  <Form.Control
                    ref={messageInputRef}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleMessageChange}
                    onPaste={handlePaste}
                    className="border px-3"
                    style={{ fontSize: '14px' }}
                  />

                  <Button 
                    variant="light" 
                    className="border"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Add emoji"
                  >
                    <FiSmile />
                  </Button>

                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={!newMessage.trim() && attachments.length === 0}
                    className="d-flex align-items-center"
                  >
                    <FiSend />
                  </Button>
                </InputGroup>
              </Form>

              {showEmojiPicker && (
                <div className="position-absolute bottom-100 end-0 mb-2">
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    disableSearchBar
                    native
                  />
                </div>
              )}
            </div>

            {typingUsers.length > 0 && (
              <div className="text-muted small mt-1">
                {getTypingIndicatorText()}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="d-flex align-items-center justify-content-center h-100">
          <div className="text-center text-muted">
            <FaUserCircle size={48} className="mb-3" />
            <h5>Select a chat to start messaging</h5>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;