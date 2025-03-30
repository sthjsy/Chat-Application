import api from './api';
import axios from 'axios';
import { API_URL } from '../constants/api';

const authService = {
  login: async (userData) => {
    try {
      console.log("signin :: username :: "+userData.username);
      console.log("signin :: password :: "+userData.password);
      const response = await api.post('/auth/signin', userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("response :: "+response.data.username);
      return {
        user: {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          fullName: response.data.fullName,
          profilePicture: response.data.profilePicture,
          status: response.data.status
        },
        token: response.data.token
      };
    } catch (error) {
      console.log("signin :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to login');
    }
  },

  register: async (userData) => {
    try {
      console.log("signup :: userData :: "+userData);
      const response = await api.post('/auth/signup', userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("signup :: response :: "+response.data);
      return {
        user: {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          fullName: response.data.fullName,
          profilePicture: response.data.profilePicture,
          status: response.data.status
        },
        token: response.data.token
      };
    } catch (error) {
      console.log("signup :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to register');
    }
  },

  getCurrentUser: async () => {
    try {
      console.log("getCurrentUser :: ");
      const response = await api.get('/users/me', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("getCurrentUser :: response :: "+response.data);
      return {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        fullName: response.data.fullName,
        profilePicture: response.data.profilePicture,
        status: response.data.status
      };
    } catch (error) {
      console.log("getCurrentUser :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to get user');
    }
  },

  updateProfile: async (userData) => {
    try {
      console.log("updateProfile :: userData :: "+userData);
      const response = await api.put('/users/profile', userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("updateProfile :: response :: "+response.data);
      return response.data;
    } catch (error) {
      console.log("updateProfile :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  fetchUserDetails: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }
};

export default authService;