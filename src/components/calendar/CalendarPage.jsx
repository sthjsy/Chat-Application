import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaComments, FaCalendarAlt, FaBullhorn, FaSearch, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import '../../components/chat/ChatApplication.css';

const CalendarPage = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="chat-application">
      {/* Top Header */}
      <header className="app-header">
        <div className="app-logo">
          <img src="/logo.png" alt="Logo" />
          <span>ChatApp</span>
        </div>
        
        <form className="search-container" onSubmit={handleSearch}>
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        
        <div className="user-profile-header">
          <div className="user-avatar">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} />
            ) : (
              <FaUserCircle size={24} />
            )}
          </div>
          <span>{user?.name || 'User'}</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="main-container">
        {/* Left Sidebar */}
        <nav className="sidebar">
          <Link 
            to="/chat" 
            className={`nav-item ${location.pathname === '/chat' ? 'active' : ''}`}
          >
            <FaComments className="nav-icon" />
            <span className="nav-text">Chat</span>
          </Link>
          
          <Link 
            to="/activity" 
            className={`nav-item ${location.pathname === '/activity' ? 'active' : ''}`}
          >
            <FaComments className="nav-icon" />
            <span className="nav-text">Activity</span>
          </Link>
          
          <Link 
            to="/calendar" 
            className={`nav-item ${location.pathname === '/calendar' ? 'active' : ''}`}
          >
            <FaCalendarAlt className="nav-icon" />
            <span className="nav-text">Calendar</span>
          </Link>
          
          <Link 
            to="/announcement" 
            className={`nav-item ${location.pathname === '/announcement' ? 'active' : ''}`}
          >
            <FaBullhorn className="nav-icon" />
            <span className="nav-text">Announcement</span>
          </Link>
          
          <div className="nav-item logout" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            <span className="nav-text">Logout</span>
          </div>
        </nav>

        {/* Main Content */}
        <main className="content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CalendarPage; 