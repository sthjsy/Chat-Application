import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {FaComments, FaCalendarAlt, FaBroadcastTower , FaSearch, FaUserCircle, FaSignOutAlt, FaBell, FaPhoneAlt, FaCommentDots ,FaFileAlt ,FaCalendarCheck  } from "react-icons/fa";
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import chatService from '../../services/chatService';
import axios from 'axios';
import './Chat.css';

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const { currentUser, logout } = useAuth();
  const { currentChat, setCurrentChat, selectChat, chats, setChats } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const profileRef = useRef(null);

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSearchResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleUserSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSearchResults(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle user search
  const handleSearch = async (query) => {
    try {
      setSearchQuery(query);
      setIsSearching(true);
      setError(null);
      
      if (query.length > 2) {
        const results = await chatService.handleSearch(query);
        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle user selection from search
  const handleUserSelect = async (user) => {
    try {
      setError(null);
      setIsSearching(true);
      
      try {
        // Try to get an existing private chat
        const chat = await chatService.getPrivateChat(user.id);
        
        console.log('search chat:', chat.id);
        chats.map(c => console.log('existing chat:', c.id));
        // Check if chat already exists in ChatList
        const existingChat = chats.find(c => c.id === chat.id);
        console.log('existingChat:', existingChat);
        if (existingChat) {
          // If chat exists, just load it into ChatWindow
          selectChat(existingChat);
          setSelectedChat(existingChat);
        } else {
          // If chat doesn't exist in ChatList, add it and load into ChatWindow
          setChats(prevChats => [chat, ...prevChats]);
          selectChat(chat);
          setSelectedChat(chat);
        }
      } catch (error) {
        // If the chat doesn't exist yet (404), create a draft chat
        if (error.response && error.response.status === 404) {
          console.log('Chat not found, creating draft chat');
          
          // Create a draft chat object
          const draftChat = {
            id: `draft-${user.id}`,
            chatType: 'PRIVATE',
            chatName: `Chat with ${user.fullName || user.username}`,
            participants: [
              {
                id: currentUser.id,
                fullName: currentUser.fullName,
                username: currentUser.username,
                email: currentUser.email
              },
              {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                email: user.email
              }
            ],
            lastMessage: 'No messages yet',
            lastMessageTime: new Date().toISOString(),
            lastMessageSenderId: null,
            totalUnreadCount: 0,
            isDraft: true
          };
          
          // Add the draft chat to the beginning of the list
          setChats(prevChats => [draftChat, ...prevChats]);
          
          // Set as current chat and selected chat
          selectChat(draftChat);
          setSelectedChat(draftChat);
        } else {
          // For other errors, show error message
          console.error('Error getting private chat:', error);
          setError('Failed to start chat. Please try again.');
        }
      }
      
      // Clear search
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error handling user selection:', error);
      setError('Failed to start chat. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleProfileHover = () => {
    if (profileRef.current) {
      const rect = profileRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom - 10,
        right: window.innerWidth - rect.right
      });
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column">
      <div className="d-flex align-items-center bg-dark text-white p-2 justify-content-between w-100">
        <div className="ms-3 fw-bold">MS Teams</div>
        <div className="d-flex align-items-center bg-light px-2 rounded w-75 position-relative" ref={searchContainerRef}>
          <FaSearch className="me-2" />
          <input 
            type="text" 
            className="form-control border-0 w-100" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
          {isSearching && (
            <div className="search-loading">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          {showSearchResults && (
            <div className="search-results-dropdown w-100">
              {error && (
                <div className="search-error p-2 text-danger">
                  {error}
                </div>
              )}
              {!error && searchResults.length === 0 && (
                <div className="search-no-results p-2 text-muted">
                  No users found
                </div>
              )}
              {searchResults.map((user, index) => (
                <div
                  key={user.id}
                  className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleUserSelect(user)}
                >
                  <FaUserCircle size={24} className="me-2" />
                  <div>
                    <div className="fw-bold">{user.fullName}</div>
                    <small className="text-muted">{user.email}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="me-3">
          <div className="current-user-profile">
            <div 
              className="user-profile-wrapper"
              ref={profileRef}
              onMouseEnter={handleProfileHover}
            >
              <FaUserCircle size={28} />
              <span className="user-name">{currentUser.fullName}</span>
              <span 
                className={`status-indicator status-${currentUser.status?.toLowerCase() || 'offline'}`}
                title={currentUser.status || 'Offline'}
              ></span>
              <div 
                className="user-profile-dropdown"
                style={{
                  top: `${dropdownPosition.top}px`,
                  right: `${dropdownPosition.right}px`
                }}
              >
                <div className="user-profile-header">
                  <FaUserCircle size={40} />
                  <div className="user-info">
                    <h6>{currentUser.fullName}</h6>
                    <span className="user-email">{currentUser.email}</span>
                    <span className={`user-status status-${currentUser.status?.toLowerCase() || 'offline'}`}>
                      {currentUser.status || 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="user-profile-actions">
                  <button className="profile-action-btn" onClick={() => navigate('/profile')}>
                    <FaUserCircle className="me-2" /> View Profile
                  </button>
                  <button className="profile-action-btn" onClick={() => navigate('/settings')}>
                    <FaBell className="me-2" /> Settings
                  </button>
                  <button className="profile-action-btn logout-btn" onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Div */}
      <div className="d-flex flex-grow-1">
        {/* Left Sidebar */}
        <nav className="sidebar">
        <Link 
            to="/activity" 
            className={`nav-item ${location.pathname === '/activity' ? 'active' : ''}`}
          >
            <FaBell size={24} className="my-3" />
            {/* <span className="nav-text">Activity</span> */}
          </Link>

          <Link 
            to="/chat" 
            className={`nav-item ${location.pathname === '/chat' ? 'active' : ''}`}
          >
            <FaComments size={24} className="my-3" />
            {/* <span className="nav-text">Chat</span> */}
          </Link>
          
          <Link 
            to="/call" 
            className={`nav-item ${location.pathname === '/call' ? 'active' : ''}`}
          >
            <FaPhoneAlt size={24} className="my-3" />
            {/* <span className="nav-text">Call</span> */}
          </Link>
          
          <Link 
            to="/calendar" 
            className={`nav-item ${location.pathname === '/calendar' ? 'active' : ''}`}
          >
            <FaCalendarAlt size={24} className="my-3" />
            {/* <span className="nav-text">Calendar</span> */}
          </Link>
          
          <Link 
            to="/announcement" 
            className={`nav-item ${location.pathname === '/announcement' ? 'active' : ''}`}
          >
            <FaBroadcastTower  className="nav-icon" />
            {/* <span className="nav-text">Announcement</span> */}
          </Link>
          
          <div className="nav-item logout" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            {/* <span className="nav-text">Logout</span> */}
          </div>
        </nav>

        {/* Chat List */}
        <div className="d-flex flex-column bg-light p-2" style={{ width: "275px" }}>
          <ChatList
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
          />
        </div>

        {/* Chat Window */}
        <div className="d-flex flex-column flex-grow-1">
          <ChatWindow selectedChat={selectedChat} />
        </div>
      </div>
    </div>
  );
};

export default Chat; 