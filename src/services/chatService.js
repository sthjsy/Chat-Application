import api from './api';
import axios from 'axios';

const API_URL = '/api';
const TOKEN = () => localStorage.getItem('token');

const chatService = {
  /**
   * Get all chats for the current user
   * @returns {Promise<Array>} Array of chat objects
   */
  getChats: async () => {
    try {
      const response = await api.get('/chats');
      return response.data;
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
      return response.data;
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
      return response.data;
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
      const response = await api.post('/chats/private', { userId });
      return response.data;
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
      
      // Validate required fields
      if (!groupData.name || !groupData.participantIds || !groupData.adminIds) {
        throw new Error('Missing required fields for group creation');
      }

      // Set default values if not provided
      const payload = {
        name: groupData.name,
        description: groupData.description || '',
        chatType: 'GROUP',
        isPublic: groupData.isPublic ?? false,
        participantIds: groupData.participantIds,
        adminIds: groupData.adminIds,
        settings: {
          allowMemberInvite: groupData.settings?.allowMemberInvite ?? false,
          allowMemberLeave: groupData.settings?.allowMemberLeave ?? true,
          allowMemberMessage: groupData.settings?.allowMemberMessage ?? true,
          ...groupData.settings
        }
      };

      console.log('Sending group creation request with payload:', payload);
      const response = await api.post('/chats/group', payload);
      console.log('Group chat created successfully:', response.data);
      return response.data;
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
      return response.data;
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
      const response = await api.get(`/messages/chat/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
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
      console.log('Sending message:', { chatId, content, messageType });
      const response = await api.post(`/messages/chat/${chatId}`, { 
        chatId,
        content,
        messageType 
      });
      console.log('Message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(error.response?.data?.message || 'Failed to send message');
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
      console.log('Editing message:', { messageId, newContent, messageType });
      const response = await api.put(`/messages/${messageId}`, { 
        chatId: chatId,
        content: newContent,
        messageType: messageType
      });
      console.log('Message edited successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw new Error(error.response?.data?.message || 'Failed to edit message');
    }
  },

  /**
   * Delete a message
   * @param {string} messageId - The ID of the message
   * @returns {Promise<void>}
   */
  deleteMessage: async (messageId) => {
    try {
      console.log('Deleting message:', messageId);
      await api.delete(`/messages/${messageId}`);
      console.log('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete message');
    }
  },

  /**
   * Mark messages as read in a chat
   * @param {string} chatId - The ID of the chat
   * @returns {Promise<void>}
   */
  markMessagesAsRead: async (chatId) => {
    try {
      await api.post(`/messages/chat/${chatId}/read`);
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
      const response = await api.post(`/chats/${chatId}/members`, { userIds });
      return response.data;
    } catch (error) {
      console.error('Error adding group members:', error);
      throw error;
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
      const response = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
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
      return response.data;
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
      return response.data;
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
      return response.data;
    } catch (error) {
      console.log("updateChat :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to update chat');
    }
  },

  markAsRead: async (chatId) => {
    try {
      console.log("markAsRead :: chatId :: "+chatId);
      const response = await api.put(`/messages/chat/${chatId}/read-all`);
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
      console.log('Adding reaction:', { chatId, messageId, emoji });
      const response = await api.post(`/messages/${messageId}/reactions`, { 
        emoji,
        messageId,
        chatId
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
      console.log('Removing reaction:', { chatId, messageId, emoji });
      const response = await api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
        data: { chatId }
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
      console.log('Editing reaction:', { chatId, messageId, oldEmoji, newEmoji });
      const response = await api.put(`/messages/${messageId}/reactions/${encodeURIComponent(oldEmoji)}`, { 
        emoji: newEmoji,
        messageId,
        chatId
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
      const response = await api.get(`/messages/${messageId}/reactions`);
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
      return response.data;
    } catch (error) {
      console.error('Error getting/creating private chat:', error);
      throw new Error(error.response?.data?.message || 'Failed to get/create private chat');
    }
  },
};

export default chatService;