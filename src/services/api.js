import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8082/api',
    // baseURL: 'http://15.207.20.44:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token here if you have a refresh token mechanism
        // const refreshResult = await refreshToken();
        // if (refreshResult.success) {
        //   localStorage.setItem('token', refreshResult.token);
        //   originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
        //   return api(originalRequest);
        // }

        // If no refresh token mechanism or refresh failed, clear auth and redirect
        localStorage.removeItem('token');
        window.location.href = '/login';
      } catch (refreshError) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api; 