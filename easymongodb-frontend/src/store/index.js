// src/store/index.js
import { createStore } from 'vuex';
import axios from '../utils/axiosConfig';

export default createStore({
  state: {
    authToken: localStorage.getItem('authToken') || null,
    user: null,
  },
  mutations: {
    setAuthToken(state, token) {
      state.authToken = token;
      localStorage.setItem('authToken', token);
    },
    clearAuthToken(state) {
      state.authToken = null;
      localStorage.removeItem('authToken');
    },
    setUser(state, user) {
      state.user = user;
    },
  },
  actions: {
    async login({ commit }, credentials) {
      try {
        const response = await axios.post('/auth/login', credentials);
        const token = response.data.token;
        commit('setAuthToken', token);
        return { success: true };
      } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: error.response?.data?.message || 'Login failed' };
      }
    },
    logout({ commit }) {
      commit('clearAuthToken');
      commit('setUser', null);
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.authToken,
  },
  modules: {},
});
