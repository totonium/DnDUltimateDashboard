/**
 * API Client Service
 * Axios-based HTTP client for Spring Boot backend communication
 *
 * @module services/apiClient
 */

import axios from 'axios';
import { db } from '../db';

// Base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const auth = await db.settings.get('auth');
      if (auth?.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear invalid session
      try {
        await db.settings.delete('auth');
      } catch (deleteError) {
        console.warn('Failed to clear user session:', deleteError);
      }
      // Redirect to login (you might want to use a router for this)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic CRUD operations
export const apiService = {
  // GET
  async get(endpoint, params = {}, config = {}) {
    const response = await api.get(endpoint, { params, ...config });
    return response.data;
  },

  // POST
  async post(endpoint, data = {}, config = {}) {
    const response = await api.post(endpoint, data, config);
    return response.data;
  },

  // PUT
  async put(endpoint, data, config = {}) {
    const response = await api.put(endpoint, data, config);
    return response.data;
  },

  // PATCH
  async patch(endpoint, data, config = {}) {
    const response = await api.patch(endpoint, data, config);
    return response.data;
  },

  // DELETE
  async delete(endpoint, config = {}) {
    const response = await api.delete(endpoint, config);
    return response.data;
  }
};

export { api };
export default api;