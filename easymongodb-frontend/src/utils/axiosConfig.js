// src/utils/axiosConfig.js
import axios from 'axios';
import store from '../store';

const axiosInstance = axios.create({
  baseURL: '/', // Replace with your backend URL
});

// Request interceptor to add the token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.state.authToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
