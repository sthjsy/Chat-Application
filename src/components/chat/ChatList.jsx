// ChatList.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import ChatItem from './ChatItem';
import { FiSearch, FiPlus, FiFilter, FiUsers, FiX } from 'react-icons/fi';
import { Form, InputGroup, Modal, Button, Badge } from 'react-bootstrap';
import chatService from '../../services/chatService';
import { WS_URLS } from '../../constants/websocket-urls';
import { getChatId } from '../../utils/chatUtils';

const ChatList = () => {
  const { 
    chats, 
    currentChat, 
    selectChat, 
    userStatuses,
    updateChatLastMessage,
    refreshChats,
    setChats
  } = useChat();
  const { currentUser } = useAuth();
  const { subscribe, unsubscribe, connected } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [userSearchError, setUserSearchError] = useState(null);
  const [groupCreateError, setGroupCreateError] = useState(null);
  const scrollRef = useRef(null);

  // Log current chats whenever they change
  useEffect(() => {
    console.log('ChatList: Current chats updated', chats);
  }, [chats]);

  useEffect(() => {
    if (!connected || !currentUser?.id) {
      console.log('ChatList: Not connected or no current user, skipping subscriptions');
      return;
    }

    console.log('ChatList: Setting up subscriptions for user', currentUser.id);

    
    // Subscribe to user-specific messages for all chats
    const messageSubscription = subscribe(`/user/${currentUser.id}/queue/messages`, (message) => {
      try {
        const messageData = JSON.parse(message.body);
        console.log('ChatList: Received message event:', messageData);
        
        // Update the chat's last message
        if (messageData.chatId) {
          console.log('ChatList: Updating last message for chat', messageData.chatId);
          updateChatLastMessage(messageData.chatId, {
            content: messageData.content,
            timestamp: messageData.createdAt,
            senderId: messageData.senderId
          });

          // If this is a new chat, add it to the list
          if (!chats.some(chat => getChatId(chat) === messageData.chatId)) {
            console.log('ChatList: New chat detected, fetching chat details');
            chatService.getChat(messageData.chatId)
              .then(newChat => {
                if (newChat) {
                  console.log('ChatList: Adding new chat to list', newChat);
                  setChats(prev => [newChat, ...prev]);
                }
              })
              .catch(error => {
                console.error('ChatList: Error fetching new chat:', error);
              });
          } else {
            // Update existing chat with new message
            console.log('ChatList: Updating existing chat with new message');
            setChats(prev => {
              const updatedChats = prev.map(chat => {
                if (getChatId(chat) === messageData.chatId) {
                  return {
                    ...chat,
                    lastMessage: messageData.content,
                    lastMessageTime: messageData.timestamp,
                    lastMessageSenderId: messageData.senderId,
                    lastMessageId: messageData.id
                  };
                }
                return chat;
              });
              
              // Move the updated chat to the top
              const updatedChat = updatedChats.find(chat => getChatId(chat) === messageData.chatId);
              if (updatedChat) {
                const filteredChats = updatedChats.filter(chat => getChatId(chat) !== messageData.chatId);
                return [updatedChat, ...filteredChats];
              }
              return updatedChats;
            });
          }
        } else {
          console.warn('ChatList: Received message without chatId', messageData);
        }
      } catch (error) {
        console.error('ChatList: Error handling message:', error);
      }
    });

    
    const chatEventSubscription = subscribe(`/topic/chat/${currentUser.id}/chat/events`, (event) => {
      try {
        const eventData = JSON.parse(event.body);
        console.log('ChatList: Received chat event:', eventData);
        
        // Handle different event types
        switch (eventData.eventType) {
          case 'NEW_CHAT':
            console.log('ChatList: Processing NEW_CHAT event');
            // Add new chat to the top of the list
            const existingChat = chats.find(c => c.id === eventData.id);
            if (existingChat) {
              console.log('ChatList: Chat already exists, skipping');
            } else {
              console.log('ChatList: Chat does not exist, adding to list');
              setChats(prev => [eventData, ...prev]);
            }
            break;
            
          case 'CHAT_UPDATE':
            console.log('ChatList: Processing CHAT_UPDATE event');
            // Update existing chat and move it to the top
            setChats(prev => {
              const updatedChats = prev.map(chat => 
                chat.id === eventData.id ? eventData : chat
              );
              const updatedChat = updatedChats.find(chat => chat.id === eventData.id);
              if (updatedChat) {
                const filteredChats = updatedChats.filter(chat => chat.id !== eventData.id);
                return [updatedChat, ...filteredChats];
              }
              return updatedChats;
            });
            break;
            
          case 'CHAT_DELETED':
            console.log('ChatList: Processing CHAT_DELETED event');
            // Remove chat from the list
            setChats(prev => prev.filter(chat => chat.id !== eventData.id));
            break;
            
          case 'PARTICIPANTS_UPDATED':
            console.log('ChatList: Processing PARTICIPANTS_UPDATED event');
            // Update chat with new participants
            setChats(prev => prev.map(chat => 
              chat.id === eventData.id ? eventData : chat
            ));
            break;
            
          case 'REMOVED_FROM_CHAT':
            console.log('ChatList: Processing REMOVED_FROM_CHAT event');
            // Remove chat if user was removed
            setChats(prev => prev.filter(chat => chat.id !== eventData.id));
            break;
            
          case 'USER_LEFT':
            console.log('ChatList: Processing USER_LEFT event');
            // Update chat when a user leaves
            setChats(prev => prev.map(chat => 
              chat.id === eventData.id ? eventData : chat
            ));
            break;
            
          case 'NEW_MESSAGE':
            console.log('ChatList: Processing NEW_MESSAGE event');
            // Update chat with new message
            setChats(prev => {
              const updatedChats = prev.map(chat => 
                chat.id === eventData.id ? eventData : chat
              );
              const updatedChat = updatedChats.find(chat => chat.id === eventData.id);
              if (updatedChat) {
                const filteredChats = updatedChats.filter(chat => chat.id !== eventData.id);
                return [updatedChat, ...filteredChats];
              }
              return updatedChats;
            });
            break;
            
          case 'MESSAGE_UPDATED':
            console.log('ChatList: Processing MESSAGE_UPDATED event');
            // Update chat with updated message
            setChats(prev => prev.map(chat => 
              chat.id === eventData.id ? eventData : chat
            ));
            break;
            
          default:
            console.log('ChatList: Unhandled chat event type:', eventData.eventType);
        }
      } catch (error) {
        console.error('ChatList: Error handling chat event:', error);
      }
    });

    return () => {
      console.log('ChatList: Cleaning up subscriptions');
      if (messageSubscription) unsubscribe(messageSubscription);
      if (chatEventSubscription) unsubscribe(chatEventSubscription);

    };
  }, [connected, currentUser, subscribe, unsubscribe, updateChatLastMessage, chats, setChats]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        // Load more chats when near bottom
        // Implement your load more logic here
      }
    }
  };

  const filteredChats = chats.filter(chat => {
    const searchLower = searchQuery.toLowerCase();
    return (
      chat?.chatName?.toLowerCase().includes(searchLower) ||
      chat?.name?.toLowerCase().includes(searchLower) ||
      chat?.participants?.some(p => 
        p?.fullName?.toLowerCase().includes(searchLower) && p?.id !== currentUser?.id
      ) ||
      chat?.lastMessage?.toLowerCase().includes(searchLower)
    );
  });

  // Handle user search for group creation
  const handleUserSearch = async (query) => {
    setUserSearchQuery(query);

    if (query.length < 2) {
      setUserSearchResults([]);
      setUserSearchError(null);
      return;
    }

    setIsSearchingUsers(true);
    setUserSearchError(null);
    try {
      const results = await chatService.searchUsers(query);
      const filteredResults = (results || []).filter(user => 
        user.id !== currentUser.id && 
        !selectedUsers.some(selected => selected.id === user.id)
      );
      setUserSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      setUserSearchResults([]);
      setUserSearchError(error.message || 'Failed to search users');
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Add user to selected users
  const handleAddUser = (user) => {
    setSelectedUsers(prev => [...prev, user]);
    setUserSearchResults(prev => prev.filter(u => u.id !== user.id));
    setUserSearchQuery('');
    setUserSearchError(null);
  };

  // Remove user from selected users
  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const resetGroupModal = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedUsers([]);
    setUserSearchQuery('');
    setUserSearchResults([]);
    setUserSearchError(null);
    setGroupCreateError(null);
  };

  const openGroupModal = () => {
    resetGroupModal();
    setShowCreateGroupModal(true);
  };

  const closeGroupModal = () => {
    setShowCreateGroupModal(false);
    resetGroupModal();
  };

  // Create group chat
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      setGroupCreateError('Enter a group name and add at least one participant.');
      return;
    }

    setIsCreatingGroup(true);
    setGroupCreateError(null);
    try {
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        participantIds: selectedUsers.map(user => user.id),
        currentUserId: currentUser.id,
        isPublic: false
      };

      const newGroupChat = await chatService.createGroupChat(groupData);
      console.log('Group chat created:', newGroupChat);
      
      setChats(prev => [newGroupChat, ...prev]);
      selectChat(newGroupChat);
      closeGroupModal();
    } catch (error) {
      console.error('Error creating group chat:', error);
      setGroupCreateError(error.message || 'Failed to create group chat');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <div className="chat-list-wrapper d-flex flex-column">
      <div className="chat-list-header p-2 border-bottom">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">Chats</h6>
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="rounded-circle p-1"
            onClick={openGroupModal}
            title="Create Group Chat"
          >
            <FiPlus size={16} />
          </Button>
        </div>
        
        <InputGroup className="mb-2">
          <InputGroup.Text className="bg-light border-end-0 py-1">
            <FiSearch />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search..."
            className="border-start-0 bg-light py-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroup.Text 
            className="bg-light border-start-0 py-1 cursor-pointer"
            onClick={() => setShowFilter(!showFilter)}
          >
            <FiFilter />
          </InputGroup.Text>
        </InputGroup>

        {showFilter && (
          <div className="px-2 py-1">
            <div className="flex flex-wrap gap-1">
              <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                All
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                Unread
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                Groups
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                Channels
              </button>
            </div>
          </div>
        )}
      </div>

      <div 
        className="chat-list-container flex-grow-1 overflow-auto"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {filteredChats.map((chat) => {
          const otherParticipant = chat?.participants?.find(p => p?.id !== currentUser?.id);
          const userStatus = otherParticipant?.status;

          return (
            <div key={chat.id} className="chat-item-wrapper">
              <ChatItem
                key={chat.id}
                chat={chat}
                chatId={chat.id}
                isSelected={getChatId(currentChat) === getChatId(chat)}
                onClick={() => selectChat(chat)}
                userStatus={userStatus}
              />
            </div>
          );
        })}
      </div>

      {/* Create Group Chat Modal */}
      <Modal show={showCreateGroupModal} onHide={closeGroupModal}>
        <Modal.Header closeButton>
          <Modal.Title>Create Group Chat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {groupCreateError && (
            <div className="alert alert-danger py-2">{groupCreateError}</div>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Group Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter group description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Add Participants</Form.Label>
              <InputGroup className="mb-2">
                <InputGroup.Text className="bg-light border-end-0 py-1">
                  <FiSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search users..."
                  className="border-start-0 bg-light py-1"
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    handleUserSearch(e.target.value);
                  }}
                />
              </InputGroup>
              
              {isSearchingUsers && (
                <div className="text-center py-2">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              
              {userSearchError && (
                <div className="text-danger small mt-2">{userSearchError}</div>
              )}

              {!userSearchError && userSearchQuery.length >= 2 && !isSearchingUsers && userSearchResults.length === 0 && (
                <div className="text-muted small mt-2">No users found</div>
              )}
              
              {userSearchResults.length > 0 && (
                <div className="user-search-results mt-2 border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {userSearchResults.map(user => (
                    <div 
                      key={user.id} 
                      className="user-search-item d-flex align-items-center p-2 cursor-pointer hover-bg-light"
                      onClick={() => handleAddUser(user)}
                    >
                      <div className="me-2">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={user.fullName} 
                            className="rounded-circle"
                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                          />
                        ) : (
                          <FiUsers size={24} />
                        )}
                      </div>
                      <div>
                        <div className="fw-bold">{user.fullName}</div>
                        <small className="text-muted">{user.email}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedUsers.length > 0 && (
                <div className="selected-users mt-2">
                  <div className="d-flex flex-wrap gap-1">
                    {selectedUsers.map(user => (
                      <Badge 
                        key={user.id} 
                        bg="primary" 
                        className="d-flex align-items-center p-2"
                      >
                        {user.fullName}
                        <FiX 
                          size={14} 
                          className="ms-1 cursor-pointer" 
                          onClick={() => handleRemoveUser(user.id)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeGroupModal}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0 || isCreatingGroup}
          >
            {isCreatingGroup ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChatList;