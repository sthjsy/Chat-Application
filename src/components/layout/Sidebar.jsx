// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import Avatar from '../common/Avatar';
import { 
  FiMessageSquare, 
  FiUsers, 
  FiPhone, 
  FiVideo, 
  FiCalendar, 
  FiSettings, 
  FiLogOut, 
  FiMenu 
} from 'react-icons/fi';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const { unreadCounts } = useChat();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // Calculate total unread messages
  const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`bg-primary-color text-white flex flex-col ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
      <div className="p-4 flex items-center">
        {!collapsed && <h1 className="text-xl font-bold">Teams Chat</h1>}
        <button
          onClick={toggleSidebar}
          className={`ml-${collapsed ? '0' : 'auto'} p-1 rounded-md hover:bg-opacity-20 hover:bg-white`}
        >
          <FiMenu size={22} />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-2 px-2">
          <NavItem 
            to="/chat" 
            icon={<FiMessageSquare size={20} />} 
            label="Chats" 
            badge={totalUnread > 0 ? totalUnread : null}
            collapsed={collapsed} 
          />
          <NavItem 
            to="/teams" 
            icon={<FiUsers size={20} />} 
            label="Teams" 
            collapsed={collapsed} 
          />
          <NavItem 
            to="/calls" 
            icon={<FiPhone size={20} />} 
            label="Calls" 
            collapsed={collapsed} 
          />
          <NavItem 
            to="/meetings" 
            icon={<FiVideo size={20} />} 
            label="Meetings" 
            collapsed={collapsed} 
          />
          <NavItem 
            to="/calendar" 
            icon={<FiCalendar size={20} />} 
            label="Calendar" 
            collapsed={collapsed} 
          />
          <NavItem 
            to="/settings" 
            icon={<FiSettings size={20} />} 
            label="Settings" 
            collapsed={collapsed} 
          />
        </ul>
      </nav>
      
      <div className={`mt-auto p-4 border-t border-white border-opacity-20 ${collapsed ? 'text-center' : 'flex items-center'}`}>
        {!collapsed && (
          <>
            <Avatar 
              src={currentUser?.avatar}
              name={currentUser?.fullName}
              size="md"
              status={currentUser?.status}
            />
            <div className="ml-3 overflow-hidden">
              <span className="text-sm font-medium text-gray-700">
                {currentUser?.fullName}
              </span>
              <p className="text-xs text-white text-opacity-70 truncate">{currentUser?.email}</p>
            </div>
          </>
        )}
        <button 
          onClick={handleLogout}
          className={`${collapsed ? 'mx-auto' : 'ml-auto'} p-2 rounded-full hover:bg-white hover:bg-opacity-20`}
          title="Logout"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

const NavItem = ({ to, icon, label, badge, collapsed }) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) => 
          `flex items-center py-2 px-3 rounded-md ${
            isActive ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
          } transition-colors ${collapsed ? 'justify-center' : ''}`
        }
      >
        <span className="relative">
          {icon}
          {badge && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center w-4 h-4">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </span>
        {!collapsed && <span className="ml-3">{label}</span>}
      </NavLink>
    </li>
  );
};

export default Sidebar;