/**
 * Authentication Service
 * Handles JWT authentication operations for the DnD Dashboard
 *
 * @module services/authService
 */

import { apiService } from './apiClient';
import { db } from '../db';

/**
 * AuthService class for managing user authentication
 * Works alongside the Zustand auth store for state management
 */
class AuthService {
  constructor() {
    this.tokenRefreshTimer = null;
  }

  /**
   * Initialize authentication state
   * @returns {Promise<object|null>} Current user or null
   */
  async init() {
    try {
      const user = await db.userProfile.get('currentUser');
      if (user?.token) {
        // Validate token by calling /me endpoint
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          return currentUser;
        } else {
          // Token is invalid, clear it
          await this.logout();
          return null;
        }
      }
      return null;
    } catch (error) {
      console.warn('Auth initialization failed:', error);
      return null;
    }
  }

  /**
   * Sign up a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} Auth response
   */
  async signUp(email, password) {
    try {
      const response = await apiService.post('/v1/auth/register', {
        email,
        password
      });

      if (response.token) {
        await this.saveSession(response.token, email);
      }

      return response;
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  }

  /**
   * Sign in an existing user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} Auth response
   */
  async signIn(email, password) {
    try {
      const response = await apiService.post('/v1/auth/login', {
        email,
        password
      });

      if (response.token) {
        await this.saveSession(response.token, email);
      }

      return response;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await db.userProfile.delete('currentUser');
      await db.syncQueue.clear();
      if (this.tokenRefreshTimer) {
        clearTimeout(this.tokenRefreshTimer);
        this.tokenRefreshTimer = null;
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /**
   * Get the current authenticated user
   * @returns {Promise<object|null>} Current user or null
   */
  async getCurrentUser() {
    try {
      const response = await apiService.get('/v1/auth/me');
      return response;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    try {
      const user = await db.userProfile.get('currentUser');
      return !!user?.token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the current JWT token
   * @returns {Promise<string|null>}
   */
  async getToken() {
    try {
      const user = await db.userProfile.get('currentUser');
      return user?.token || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save session to IndexedDB
   * @param {string} token - JWT token
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async saveSession(token, email) {
    try {
      await db.userProfile.put({
        key: 'currentUser',
        token,
        email,
        loginTime: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      await apiService.post('/v1/auth/reset-password', { email });
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Clean up the auth service
   */
  cleanup() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }
}

export const authService = new AuthService();
export default authService;
