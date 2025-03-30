import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Nav, Alert } from 'react-bootstrap';
import { FiBell, FiCalendar, FiMessageSquare, FiPhone, FiFile } from 'react-icons/fi';
import { FaUserCircle, FaSearch, FaVideo, FaPhone, FaSmile, FaPaperclip, FaPaperPlane, FaBell, FaCommentDots, FaCalendarAlt, FaPhoneAlt, FaFileAlt, FaCheck, FaCheckDouble, FaSignOutAlt } from "react-icons/fa";
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import chatService from '../../services/chatService';
import axios from 'axios';
import './Chat.css';
import { useNavigate } from 'react-router-dom';

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
      const searchResults = await chatService.handleSearch(query);
      setSearchResults(searchResults);
    } catch (error) {
      console.error('Error searching chats:', error);
      setError('Failed to search chats');
    }
  };

  // Handle user selection from search
  const handleUserSelect = async (user) => {
    try {
      setError(null);
      console.log('Getting/Creating private chat with user:', user.id);
      const chat = await chatService.getPrivateChat(user.id);
      console.log('Chat result:', chat);
      
      // Update chat list if the chat is not already in the list
      if (!chats.some(c => c.id === chat.id)) {
        console.log('Adding new chat to chat list');
        setChats(prevChats => [chat, ...prevChats]);
      }
      
      // Set the chat as selected and current
      setSelectedChat(chat);
      selectChat(chat);
      
      // Clear search
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error handling user selection:', error);
      setError('Failed to start chat. Please try again.');
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
      <div className="d-flex align-items-center bg-dark text-white p-2 justify-content-between">
        <div className="ms-3 fw-bold">MS Teams</div>
        <div className="d-flex align-items-center bg-light px-2 rounded w-50 position-relative" ref={searchContainerRef}>
          <FaSearch className="me-2" />
          <input 
            type="text" 
            className="form-control border-0" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
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
            <div className="search-results-dropdown">
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
        {/* Sidebar */}
        <div className="d-flex flex-column bg-secondary text-white p-3" style={{ width: "60px" }}>
          <FaBell size={24} className="my-3" />
          <FaCommentDots size={24} className="my-3" />
          <FaCalendarAlt size={24} className="my-3" />
          <FaPhoneAlt size={24} className="my-3" />
          <FaFileAlt size={24} className="my-3" />
        </div>

        {/* Chat List */}
        <div className="d-flex flex-column bg-light p-2" style={{ width: "275px" }}>
          <h6 className="fw-bold">Chats</h6>
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