import api from './api';

const callService = {
  initiateCall: async ({ participantId, groupId, callType = 'AUDIO' }) => {
    try {
      const response = await api.post('/calls/initiate', {
        participantId,
        groupId,
        callType: callType.toUpperCase(),
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to initiate call');
    }
  },

  acceptCall: async (callId) => {
    try {
      const response = await api.post(`/calls/${callId}/accept`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to accept call');
    }
  },

  rejectCall: async (callId) => {
    try {
      const response = await api.post(`/calls/${callId}/reject`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reject call');
    }
  },

  endCall: async (callId) => {
    try {
      const response = await api.post(`/calls/${callId}/end`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to end call');
    }
  },

  getCallHistory: async () => {
    try {
      const response = await api.get('/calls/history');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get call history');
    }
  },
};

export default callService;