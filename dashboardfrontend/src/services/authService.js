/**
 * Authentication Service
 * Handles Firebase authentication operations for the DnD Dashboard
 *
 * @module services/authService
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { db } from '../db';
import { syncService } from './sync';

/**
 * AuthService class for managing user authentication
 * Works alongside the Zustand auth store for state management
 */
class AuthService {
  constructor() {
    this.unsubscribe = null;
  }

  /**
   * Initialize authentication state listener
   * @returns {Function} Unsubscribe function
   */
  init() {
    return new Promise((resolve) => {
      this.unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Store user in IndexedDB for offline access
          await db.settings.put({
            key: 'currentUser',
            value: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL
            }
          });
          // Trigger full sync with Firestore
          await syncService.initialize(user.uid);
        } else {
          await db.settings.delete('currentUser');
        }
        resolve(user);
      });
    });
  }

  /**
   * Sign up a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} displayName - Optional display name
   * @returns {Promise<object>} User credential
   */
  async signUp(email, password, displayName = null) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    await db.settings.put({
      key: 'currentUser',
      value: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      }
    });

    return userCredential;
  }

  /**
   * Sign in an existing user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} User credential
   */
  async signIn(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Initialize sync after successful login
    await syncService.initialize(userCredential.user.uid);

    return userCredential;
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    await syncService.cleanup();
    await signOut(auth);
    await db.settings.delete('currentUser');
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  /**
   * Get the current authenticated user
   * @returns {object|null} Current user or null
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!auth.currentUser;
  }

  /**
   * Get the current user ID
   * @returns {string|null}
   */
  async getCurrentUserId() {
    const user = await db.settings.get('currentUser');
    return user?.value?.uid || auth.currentUser?.uid || null;
  }

  /**
   * Clean up the auth listener
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export const authService = new AuthService();
export default authService;
