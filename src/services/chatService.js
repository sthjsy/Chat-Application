import api from './api';
import { normalizeChat, normalizeChats } from '../utils/chatUtils';

const TOKEN = () => localStorage.getItem('token');

const requireChatId = (chatId, action) => {
  const resolvedChatId = chatId ?? null;
  if (resolvedChatId == null || resolvedChatId === '') {
    throw new Error(`chatId is required to ${action}`);
  }
  return resolvedChatId;
};

const searchUsersRequest = async (query) => {
  const trimmedQuery = query?.trim();
  if (!trimmedQuery || trimmedQuery.length < 2) {
    return [];
  }

  const encoded = encodeURIComponent(trimmedQuery);

  try {
    const response = await api.get(`/users/search/${encoded}`);
    const data = response.data;
    return Array.isArray(data) ? data : (data?.content ?? data?.users ?? []);
  } catch (pathError) {
    if (pathError.response?.status && pathError.response.status !== 404) {
      throw pathError;
    }
    const response = await api.get(`/users/search?q=${encoded}`);
    const data = response.data;
    return Array.isArray(data) ? data : (data?.content ?? data?.users ?? []);
  }
};

const chatService = {
  /**
   * Get all chats for the current user
   * @returns {Promise<Array>} Array of chat objects
   */
  getChats: async () => {
    try {
      const response = await api.get('/chats');
      return normalizeChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw new Error('Failed to fetch chats');
    }
  },

  /**
   * Get private chats for the current user
   */
  getPrivateChats: async () => {
    try {
      const response = await api.get('/chats/private');
      return normalizeChats(response.data);
    } catch (error) {
      console.error('Error fetching private chats:', error);
      throw error;
    }
  },

  /**
   * Get group chats for the current user
   */
  getGroupChats: async () => {
    try {
      const response = await api.get('/chats/group');
      return normalizeChats(response.data);
    } catch (error) {
      console.error('Error fetching group chats:', error);
      throw error;
    }
  },

  /**
   * Create a private chat with another user
   * @param {string} userId - The ID of the user to create a chat with
   */
  createPrivateChat: async (userId) => {
    try {
      const response = await api.post(`/chats/private/${userId}`);
      return normalizeChat(response.data);
    } catch (error) {
      console.error('Error creating private chat:', error);
      throw new Error('Failed to create private chat');
    }
  },

  /**
   * Create a group chat
   * @param {Object} groupData - The group chat data
   * @param {string} groupData.name - The name of the group
   * @param {string} groupData.description - The description of the group
   * @param {boolean} groupData.isPublic - Whether the group is public or private
   * @param {Array<string>} groupData.participantIds - Array of participant user IDs
   * @param {Array<string>} groupData.adminIds - Array of admin user IDs
   * @param {Object} groupData.settings - Group settings
   * @returns {Promise<Object>} The created group chat object
   */
  createGroupChat: async (groupData) => {
    try {
      console.log('Creating group chat with data:', groupData);

      const participantIds = [
        ...new Set(
          [
            ...(groupData.participantIds || []),
            ...(groupData.currentUserId ? [groupData.currentUserId] : [])
          ].filter((id) => id != null && id !== '')
        )
      ];

      if (participantIds.length < 2) {
        throw new Error('Select at least one other participant for the group');
      }

      const payload = {
        chatName: groupData.name || groupData.chatName,
        description: groupData.description || '',
        chatType: 'GROUP',
        isPublic: groupData.isPublic ?? false,
        participantIds
      };

      console.log('Sending group creation request with payload:', payload);
      const response = await api.post('/chats/group', payload);
      console.log('Group chat created successfully:', response.data);
      return normalizeChat(response.data);
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw new Error(error.response?.data?.message || 'Failed to create group chat');
    }
  },

  /**
   * Create a channel
   * @param {Object} channelData - The channel data
   * @param {string} channelData.name - The name of the channel
   * @param {string} channelData.description - The channel description
   * @param {Array<string>} channelData.participantIds - Array of participant user IDs
   * @returns {Promise<Object>} The created channel object
   */
  createChannel: async (channelData) => {
    try {
      const response = await api.post('/chats/channel', channelData);
      return normalizeChat(response.data);
    } catch (error) {
      console.error('Error creating channel:', error);
      throw new Error('Failed to create channel');
    }
  },

  /**
   * Get messages for a specific chat
   * @param {string} chatId - The ID of the chat
   * @returns {Promise<Array>} Array of message objects
   */
  getMessages: async (chatId) => {
    try {
      const resolvedChatId = requireChatId(chatId, 'fetch messages');
      const response = await api.get(`/messages/chat/${resolvedChatId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * Send a message in a chat
   * @param {string} chatId - The ID of the chat
   * @param {string} content - The message content
   * @param {string} messageType - The type of message (TEXT, IMAGE, VIDEO, etc.)
   * @returns {Promise<Object>} The sent message object
   */
  sendMessage: async (chatId, content, messageType = 'TEXT') => {
    try {
      const resolvedChatId = requireChatId(chatId, 'send message');
      console.log('Sending message:', { chatId: resolvedChatId, content, messageType });
      const response = await api.post(`/messages/chat`, {
        chatId: resolvedChatId,
        content,
        messageType
      });
      console.log('Message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Edit a message
   * @param {string} chatId - The ID of the chat
   * @param {string} messageId - The ID of the message
   * @param {string} newContent - The new message content
   * @param {string} messageType - The type of message (TEXT, IMAGE, VIDEO, etc.)
   * @returns {Promise<Object>} The updated message object
   */
  editMessage: async (chatId, messageId, newContent, messageType = 'TEXT') => {
    try {
      const resolvedChatId = requireChatId(chatId, 'edit message');
      console.log('Editing message:', { messageId, newContent, messageType, chatId: resolvedChatId });
      const response = await api.put(`/messages/update/message`, {
        content: newContent,
        messageId,
        chatId: resolvedChatId,
        messageType
      });
      console.log('Message edited successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  /**
   * Delete a message
   * @param {string} chatId - The ID of the chat
   * @param {string} messageId - The ID of the message
   * @returns {Promise<void>}
   */
  deleteMessage: async (chatId, messageId) => {
    try {
      const resolvedChatId = requireChatId(chatId, 'delete message');
      console.log('Deleting message:', { messageId, chatId: resolvedChatId });
      const response = await api.delete(`/messages/delete/message/${messageId}`, {
        data: { messageId, chatId: resolvedChatId }
      });
      console.log('Message deleted successfully'+response);
      console.log('Message deleted successfully'+response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  /**
   * Mark messages as read in a chat
   * @param {string} chatId - The ID of the chat
   * @returns {Promise<void>}
   */
  markMessagesAsRead: async (chatId) => {
    try {
      const resolvedChatId = requireChatId(chatId, 'mark messages as read');
      console.log('markMessagesAsRead :: chatId ::', resolvedChatId);
      const response = await api.post(`/messages/chat/read-all`, { chatId: resolvedChatId });
      console.log("markMessagesAsRead :: "+response.data);
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  },

  /**
   * Add a participant to a chat
   * @param {string} chatId - The ID of the chat
   * @param {string} userId - The ID of the user to add
   * @returns {Promise<Object>} The updated chat object
   */
  addParticipant: async (chatId, userId) => {
    try {
      const response = await api.post(`/chats/${chatId}/participants`, { userId });
      return normalizeChat(response.data);
    } catch (error) {
      console.error('Error adding participant:', error);
      throw new Error('Failed to add participant');
    }
  },

  /**
   * Remove a participant from a chat
   * @param {string} chatId - The ID of the chat
   * @param {string} userId - The ID of the user to remove
   * @returns {Promise<Object>} The updated chat object
   */
  removeParticipant: async (chatId, userId) => {
    try {
      const response = await api.delete(`/chats/${chatId}/participants/${userId}`);
      return normalizeChat(response.data);
    } catch (error) {
      console.error('Error removing participant:', error);
      throw new Error('Failed to remove participant');
    }
  },

  /**
   * Add an admin to a chat
   * @param {string} chatId - The ID of the chat
   * @param {string} userId - The ID of the user to make admin
   * @returns {Promise<Object>} The updated chat object
   */
  addAdmin: async (chatId, userId) => {
    try {
      const response = await api.post(`/chats/${chatId}/admins`, { userId });
      return normalizeChat(response.data);
    } catch (error) {
      console.error('Error adding admin:', error);
      throw new Error('Failed to add admin');
    }
  },

  /**
   * Remove an admin from a chat
   * @param {string} chatId - The ID of the chat
   * @param {string} userId - The ID of the admin to remove
   * @returns {Promise<Object>} The updated chat object
   */
  removeAdmin: async (chatId, userId) => {
    try {
      const response = await api.delete(`/chats/${chatId}/admins/${userId}`);
      return normalizeChat(response.data);
    } catch (error) {
      console.error('Error removing admin:', error);
      throw new Error('Failed to remove admin');
    }
  },

  /**
   * Create a new chat with another user
   * @param {string} userId - The ID of the user to chat with
   * @returns {Promise<Object>} The created chat
   */
  createNewChat: async (userId) => {
    try {
      const response = await api.post('/chats', { userId });
      return normalizeChat(response.data);
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  },

  /**
   * Add members to a group chat
   * @param {string} chatId - The ID of the group chat
   * @param {Array} userIds - Array of user IDs to add
   * @returns {Promise<Object>} The updated group chat
   */
  addMembers: async (chatId, userIds) => {
    try {
      const resolvedChatId = requireChatId(chatId, 'add group members');
      const ids = Array.isArray(userIds) ? userIds : [userIds];

      try {
        const response = await api.post(`/chats/${resolvedChatId}/participants`, { userIds: ids });
        return normalizeChat(response.data);
      } catch (participantsError) {
        const response = await api.post(`/chats/${resolvedChatId}/members`, { userIds: ids });
        return normalizeChat(response.data);
      }
    } catch (error) {
      console.error('Error adding group members:', error);
      throw new Error(error.response?.data?.message || 'Failed to add group members');
    }
  },

  /**
   * Remove a member from a group chat
   * @param {string} chatId - The ID of the group chat
   * @param {string} userId - The ID of the user to remove
   * @returns {Promise<Object>} The updated group chat
   */
  removeMember: async (chatId, userId) => {
    try {
      const response = await api.delete(`/chats/${chatId}/members/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },

  /**
   * Update group chat settings
   * @param {string} chatId - The ID of the group chat
   * @param {Object} settings - The settings to update
   * @returns {Promise<Object>} The updated group chat
   */
  updateChatSettings: async (chatId, settings) => {
    try {
      const response = await api.put(`/chats/${chatId}/settings`, settings);
      return response.data;
    } catch (error) {
      console.error('Error updating chat settings:', error);
      throw error;
    }
  },

  /**
   * Search for users
   * @param {string} query - The search query
   * @returns {Promise<Array>} Array of user objects
   */
  searchUsers: async (query) => {
    try {
      return await searchUsersRequest(query);
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error(error.response?.data?.message || 'Failed to search users');
    }
  },

  /**
   * Get chat details
   * @param {string} chatId - The ID of the chat
   * @returns {Promise<Object>} The chat details
   */
  getChatDetails: async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}`);
      return normalizeChat(response.data);
    } catch (error) {
      console.error('Error fetching chat details:', error);
      throw error;
    }
  },

  /**
   * Leave a group chat
   * @param {string} chatId - The ID of the group chat
   * @returns {Promise<void>}
   */
  getChat: async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}`);
      return normalizeChat(response.data);
    } catch (error) {
      console.error('Error fetching chat:', error);
      throw error;
    }
  },

  updateChat: async (chatId, data) => {
    try {
      console.log("updateChat :: chatId :: "+chatId);
      const response = await api.put(`/chats/${chatId}`, data);
      console.log("updateChat :: "+response.data);
      return normalizeChat(response.data);
    } catch (error) {
      console.log("updateChat :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to update chat');
    }
  },

  markAsRead: async (chatId) => {
    try {
      const resolvedChatId = requireChatId(chatId, 'mark chat as read');
      console.log('markAsRead :: chatId ::', resolvedChatId);
      const response = await api.put(`/messages/chat/read-all`, { chatId: resolvedChatId });
      console.log("markAsRead :: "+response.data);
      return response.data;
    } catch (error) {
      console.log("markAsRead :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to mark as read');
    }
  },

  /**
   * Add a reaction to a message
   * @param {string} chatId - The ID of the chat
   * @param {string} messageId - The ID of the message
   * @param {string} emoji - The emoji reaction
   * @returns {Promise<Object>} The updated message with reactions
   */
  addReaction: async (chatId, messageId, emoji) => {
    try {
      const resolvedChatId = requireChatId(chatId, 'add reaction');
      console.log('Adding reaction:', { chatId: resolvedChatId, messageId, emoji });
      const response = await api.post(`/messages/reactions`, { 
        reactionType: emoji,
        messageId,
        chatId: resolvedChatId
      });
      console.log('Reaction added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw new Error(error.response?.data?.message || 'Failed to add reaction');
    }
  },

  /**
   * Remove a reaction from a message
   * @param {string} chatId - The ID of the chat
   * @param {string} messageId - The ID of the message
   * @param {string} emoji - The emoji reaction to remove
   * @returns {Promise<Object>} The updated message with reactions
   */
  removeReaction: async (chatId, messageId, emoji) => {
    try {
      const resolvedChatId = requireChatId(chatId, 'remove reaction');
      console.log('Removing reaction:', { chatId: resolvedChatId, messageId, emoji });
      const response = await api.delete(`/messages/reactions`, {
        data: { chatId: resolvedChatId, reactionType: emoji, messageId }
      });
      console.log('Reaction removed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove reaction');
    }
  },

  /**
   * Edit a reaction on a message
   * @param {string} chatId - The ID of the chat
   * @param {string} messageId - The ID of the message
   * @param {string} oldEmoji - The old emoji reaction
   * @param {string} newEmoji - The new emoji reaction
   * @returns {Promise<Object>} The updated message with reactions
   */
  editReaction: async (chatId, messageId, oldEmoji, newEmoji) => {
    try {
      const resolvedChatId = requireChatId(chatId, 'edit reaction');
      console.log('Editing reaction:', { chatId: resolvedChatId, messageId, oldEmoji, newEmoji });
      const response = await api.put(`/messages/reactions`, { 
        reactionType: oldEmoji,
        messageId,
        chatId: resolvedChatId
      });
      console.log('Reaction edited successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error editing reaction:', error);
      throw new Error(error.response?.data?.message || 'Failed to edit reaction');
    }
  },

  /**
   * Get reactions for a message
   * @param {string} messageId - The ID of the message
   * @returns {Promise<Array>} Array of reaction objects
   */
  getMessageReactions: async (messageId) => {
    try {
      console.log('Getting reactions for message:', messageId);
      const response = await api.get(`/messages/reactions/${messageId}`);
      console.log('Reactions retrieved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting reactions:', error);
      throw new Error(error.response?.data?.message || 'Failed to get reactions');
    }
  },

  /**
   * Get or create a private chat with a user
   * @param {string} userId - The ID of the user to chat with
   * @returns {Promise<Object>} The private chat object
   */
  getPrivateChat: async (userId) => {
    try {
      console.log('Getting/Creating private chat with user:', userId);
      const response = await api.post(`/chats/private/${userId}`);
      console.log('Private chat result:', response.data);
      return normalizeChat(response.data);
    } catch (error) {
      console.error('Error getting/creating private chat:', error);
      throw error;
    }
  },

  handleSearch: searchUsersRequest,

  leaveGroupChat: async (chatId) => {
    try {
      const resolvedChatId = requireChatId(chatId, 'leave group chat');
      await api.post(`/chats/${resolvedChatId}/leave`);
    } catch (error) {
      console.error('Error leaving group chat:', error);
      throw new Error(error.response?.data?.message || 'Failed to leave group chat');
    }
  },

  addGroupMembers: async (chatId, userIds) => {
    return chatService.addMembers(chatId, userIds);
  },

  removeGroupMember: async (chatId, userId) => {
    return chatService.removeMember(chatId, userId);
  },

  updateGroupSettings: async (chatId, settings) => {
    return chatService.updateChatSettings(chatId, settings);
  },
};

export default chatService;