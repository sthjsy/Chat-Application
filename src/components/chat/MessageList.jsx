import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup, availableUsers = [] }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState({});
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setDescription('');
      setSelectedUsers([]);
      setSearchQuery('');
      setErrors({});
    }
  }, [isOpen]);
  
  const handleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!groupName.trim()) {
      newErrors.groupName = 'Group name is required';
    }
    
    if (selectedUsers.length === 0) {
      newErrors.users = 'Select at least one member';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onCreateGroup({
        name: groupName.trim(),
        description: description.trim(),
        members: selectedUsers
      });
      onClose();
    }
  };
  
  const filteredUsers = availableUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const styles = {
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontWeight: '500',
      fontSize: '14px',
      color: '#252424'
    },
    input: {
      padding: '10px 12px',
      border: '1px solid #c8c6c4',
      borderRadius: '4px',
      fontSize: '14px'
    },
    inputError: {
      padding: '10px 12px',
      border: '1px solid #d13438',
      borderRadius: '4px',
      fontSize: '14px'
    },
    textarea: {
      padding: '10px 12px',
      border: '1px solid #c8c6c4',
      borderRadius: '4px',
      fontSize: '14px',
      resize: 'vertical',
      minHeight: '80px'
    },
    errorMessage: {
      color: '#d13438',
      fontSize: '12px',
      marginTop: '4px'
    },
    searchContainer: {
      position: 'relative',
      marginBottom: '8px'
    },
    searchInput: {
      padding: '10px 32px 10px 12px',
      border: '1px solid #c8c6c4',
      borderRadius: '4px',
      fontSize: '14px',
      width: '100%'
    },
    clearSearch: {
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      fontSize: '18px',
      color: '#666',
      cursor: 'pointer'
    },
    selectedCount: {
      fontSize: '12px',
      color: '#605e5c',
      marginBottom: '8px'
    },
    usersList: {
      maxHeight: '300px',
      overflowY: 'auto',
      border: '1px solid #c8c6c4',
      borderRadius: '4px'
    },
    userItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 12px',
      cursor: 'pointer',
      borderBottom: '1px solid #f3f2f1',
      transition: 'background-color 0.2s'
    },
    userItemSelected: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 12px',
      cursor: 'pointer',
      borderBottom: '1px solid #f3f2f1',
      backgroundColor: '#f3f9ff',
      transition: 'background-color 0.2s'
    },
    userAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      overflow: 'hidden',
      marginRight: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: '#6264a7',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '500'
    },
    userInfo: {
      flex: 1
    },
    userName: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#252424'
    },
    userEmail: {
      fontSize: '12px',
      color: '#605e5c'
    },
    noUsers: {
      padding: '16px',
      textAlign: 'center',
      color: '#605e5c',
      fontStyle: 'italic'
    },
    formActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '8px'
    },
    cancelButton: {
      padding: '8px 16px',
      backgroundColor: 'transparent',
      border: '1px solid #8a8886',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#252424',
      cursor: 'pointer'
    },
    createButton: {
      padding: '8px 16px',
      backgroundColor: '#6264a7',
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
      color: 'white',
      cursor: 'pointer'
    }
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Create New Group"
      size="medium"
    >
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="groupName" style={styles.label}>Group Name *</label>
          <input
            id="groupName"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            style={errors.groupName ? styles.inputError : styles.input}
          />
          {errors.groupName && <span style={styles.errorMessage}>{errors.groupName}</span>}
        </div>
        
        <div style={styles.formGroup}>
          <label htmlFor="description" style={styles.label}>Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter group description (optional)"
            rows={3}
            style={styles.textarea}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Add Members *</label>
          <div style={styles.searchContainer}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email"
              style={styles.searchInput}
            />
            {searchQuery && (
              <button 
                type="button" 
                style={styles.clearSearch} 
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>
          
          {errors.users && <span style={styles.errorMessage}>{errors.users}</span>}
          
          <div style={styles.selectedCount}>
            Selected: {selectedUsers.length} users
          </div>
          
          <div style={styles.usersList}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  style={selectedUsers.includes(user.id) ? styles.userItemSelected : styles.userItem}
                  onClick={() => handleUserSelection(user.id)}
                >
                  <div style={styles.userAvatar}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <div style={styles.avatarPlaceholder}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>{user.name}</div>
                    <div style={styles.userEmail}>{user.email}</div>
                  </div>
                  <div>
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => {}} // Handled by parent div click
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.noUsers}>No users found</div>
            )}
          </div>
        </div>
        
        <div style={styles.formActions}>
          <button 
            type="button" 
            style={styles.cancelButton} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            style={styles.createButton}
          >
            Create Group
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;