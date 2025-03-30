// CreateGroupModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, UserMinus } from 'lucide-react';

const CreateGroupModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setAvailableUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleAddUser = (user) => {
    setSelectedUsers(prev => [...prev, user]);
    setAvailableUsers(prev => prev.filter(u => u.id !== user.id));
  };

  const handleRemoveUser = (user) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    setAvailableUsers(prev => [...prev, user]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      // Show error for missing name
      return;
    }
    
    onCreate({
      name,
      description,
      members: selectedUsers.map(user => user.id)
    });
  };

  const filteredUsers = availableUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

//   return (
    // <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    //   <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
    //     <div className="p-4 border-b border-gray-200 flex justify-between items-center">
    //       <h2 className="text-xl font-semibold">Create New Group</h2>
    //       <button 
    //         onClick={onClose}
    //         className="p-1 rounded-full hover:bg-gray-200"
    //       >
    //         <X size={20} />
    //       </button>
    //     </div>
        
    //     <form onSubmit={handleSubmit}>
    //       <div className="p-4">
    //         <div className="mb-4">
    //           <label className="block text-sm font-medium mb-1">Group Name</label>
    //           <input 
    //             type="text" 
    //             value={name}
    //             onChange={(e) => setName(e.target.value)}
    //             className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //             placeholder="Enter group name"
    //             required
    //           />
    //         </div>
            
    //         <div className="mb-4">
    //           <label className="block text-sm font-medium mb-1">Description</label>
    //           <textarea 
    //             value={description}
    //             onChange={(e) => setDescription(e.target.value)}
    //             className="w-
      return (
        <div
          className={`flex items-center p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-200 ${
            isSelected ? 'bg-blue-50' : ''
          }`}
          onClick={onClick}
        >
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
            {group.avatar ? (
              <img src={group.avatar} alt={group.name} className="w-10 h-10 rounded-full" />
            ) : (
              <Users size={18} className="text-white" />
            )}
          </div>
          
          <div className="ml-3 flex-grow min-w-0">
            <div className="flex justify-between items-center">
              <span className="font-medium truncate">{group.name}</span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                {group.memberCount} members
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">{group.description || 'No description'}</p>
          </div>
        </div>
      );
    };

    export default CreateGroupModal;