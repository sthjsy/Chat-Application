// GroupList.jsx
import React, { useState, useEffect } from 'react';
import GroupItem from './GroupItem';
import { Plus } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';
import { useAuth } from '../../contexts/AuthContext';

const GroupList = ({ onSelectGroup, selectedGroupId }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setGroups(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleGroupClick = (group) => {
    onSelectGroup(group);
  };

  const handleCreateGroup = async (groupData) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(groupData)
      });
      
      if (!response.ok) throw new Error('Failed to create group');
      
      const newGroup = await response.json();
      setGroups(prevGroups => [...prevGroups, newGroup]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading groups...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
        <h2 className="text-lg font-semibold">Teams & Groups</h2>
        <button 
          className="p-2 rounded-full hover:bg-gray-200"
          onClick={() => setShowCreateModal(true)}
          title="Create new group"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="overflow-y-auto flex-grow">
        {groups.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No groups available</div>
        ) : (
          groups.map(group => (
            <GroupItem
              key={group.id}
              group={group}
              isSelected={selectedGroupId === group.id}
              onClick={() => handleGroupClick(group)}
              currentUserId={currentUser.id}
            />
          ))
        )}
      </div>
      
      {showCreateModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  );
};

export default GroupList;