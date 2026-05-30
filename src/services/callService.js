import axios from 'axios';

const API_URL = 'http://localhost:8082/api/calls';
// const API_URL = 'http://15.207.20.44:8080/api/calls';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const callService = {
  initiateCall: async (callId, participants, isVideo = true) => {
    try {
      console.log("initiateCall :: callId :: "+callId);
      console.log("initiateCall :: participants :: "+participants);
      console.log("initiateCall :: isVideo :: "+isVideo);
      const response = await axios.post(API_URL, {
        callId,
        participants,
        type: isVideo ? 'video' : 'audio'
      }, {
        headers: getAuthHeader()
      });
      console.log("initiateCall :: "+response.data);
      return response.data;
    } catch (error) {
      console.log("initiateCall :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to initiate call');
    }
  },

  acceptCall: async (callId) => {
    try {
      console.log("acceptCall :: callId :: "+callId);
      const response = await axios.post(`${API_URL}/${callId}/accept`, {}, {
        headers: getAuthHeader()
      });
      console.log("acceptCall :: "+response.data);
      return response.data;
    } catch (error) {
      console.log("acceptCall :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to accept call');
    }
  },

  rejectCall: async (callId) => {
    try {
      console.log("rejectCall :: callId :: "+callId);
      const response = await axios.post(`${API_URL}/${callId}/reject`, {}, {
        headers: getAuthHeader()
      });
      console.log("rejectCall :: "+response.data);
      return response.data;
    } catch (error) {
      console.log("rejectCall :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to reject call');
    }
  },

  endCall: async (callId) => {
    try {
      console.log("endCall :: callId :: "+callId);
      const response = await axios.post(`${API_URL}/${callId}/end`, {}, {
        headers: getAuthHeader()
      });
      console.log("endCall :: "+response.data);
      return response.data;
    } catch (error) {
      console.log("endCall :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to end call');
    }
  },

  getCallHistory: async () => {
    try {
      console.log("getCallHistory :: ");
      const response = await axios.get(`${API_URL}/history`, {
        headers: getAuthHeader()
      });
      console.log("getCallHistory :: "+response.data);
      return response.data;
    } catch (error) {
      console.log("getCallHistory :: error :: "+error);
      throw new Error(error.response?.data?.message || 'Failed to get call history');
    }
  },
};

export default callService;