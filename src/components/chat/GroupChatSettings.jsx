import React, { useState } from 'react';
import { FiX, FiSearch, FiUserPlus, FiUserMinus, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import chatService from '../../services/chatService';

const GroupChatSettings = ({ chat, onClose, onUpdate }) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle user search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const results = await chatService.searchUsers(query);
      // Filter out users who are already members
      const filteredResults = results.filter(
        user => !chat.participants.some(p => p.id === user.id)
      );
      setSearchResults(filteredResults);
      setError(null);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a member
  const handleAddMember = async (userId) => {
    try {
      setLoading(true);
      const updatedChat = await chatService.addGroupMembers(chat.id, [userId]);
      onUpdate(updatedChat);
      setSearchResults([]);
      setSearchQuery('');
      setError(null);
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  // Handle removing a member
  const handleRemoveMember = async (userId) => {
    if (userId === currentUser.id) {
      try {
        setLoading(true);
        await chatService.leaveGroupChat(chat.id);
        onClose();
      } catch (error) {
        console.error('Error leaving group:', error);
        setError('Failed to leave group');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        const updatedChat = await chatService.removeGroupMember(chat.id, userId);
        onUpdate(updatedChat);
        setError(null);
      } catch (error) {
        console.error('Error removing member:', error);
        setError('Failed to remove member');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle updating group settings
  const handleUpdateSettings = async (settings) => {
    try {
      setLoading(true);
      const updatedChat = await chatService.updateGroupSettings(chat.id, settings);
      onUpdate(updatedChat);
      setError(null);
    } catch (error) {
      console.error('Error updating group settings:', error);
      setError('Failed to update group settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-96 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Group Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={chat.name}
              onChange={(e) => handleUpdateSettings({ name: e.target.value })}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Add Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Members
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {loading && (
              <div className="mt-2 text-sm text-gray-500">Searching...</div>
            )}
            {error && (
              <div className="mt-2 text-sm text-red-500">{error}</div>
            )}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(user.id)}
                      className="p-2 text-blue-500 hover:text-blue-600"
                    >
                      <FiUserPlus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Members
            </label>
            <div className="space-y-2">
              {chat.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {participant.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {participant.username}
                        {participant.id === currentUser.id && ' (You)'}
                      </p>
                      <p className="text-sm text-gray-500">{participant.email}</p>
                    </div>
                  </div>
                  {participant.id !== currentUser.id && (
                    <button
                      onClick={() => handleRemoveMember(participant.id)}
                      className="p-2 text-red-500 hover:text-red-600"
                    >
                      <FiUserMinus size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChatSettings; 