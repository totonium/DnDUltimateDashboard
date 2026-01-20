/**
 * Authentication Hook
 * React hook for authentication state and operations
 *
 * @module hooks/useAuth
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/auth';
import { authService } from '../services/authService';

/**
 * useAuth - Authentication hook for managing user state
 * @returns {object} Auth state and methods
 */
export function useAuth() {
  const {
    user,
    userId,
    isAuthenticated,
    isLoading,
    error,
    init,
    login,
    register,
    logout,
    clearError
  } = useAuthStore();

  const [initialized, setInitialized] = useState(false);

  // Initialize auth listener on mount
  useEffect(() => {
    let unsubscribe;
    const initialize = async () => {
      unsubscribe = await init();
      setInitialized(true);
    };

    initialize();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [init]);

  const handleLogin = useCallback(async (email, password) => {
    try {
      await login(email, password);
      await authService.init();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [login]);

  const handleRegister = useCallback(async (email, password, displayName) => {
    try {
      await register(email, password, displayName);
      await authService.init();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [register]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      authService.cleanup();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [logout]);

  const resetPassword = useCallback(async (email) => {
    try {
      await authService.resetPassword(email);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    user,
    userId,
    isAuthenticated: isAuthenticated && initialized,
    isLoading: isLoading || !initialized,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError,
    resetPassword,
    getCurrentUser: () => authService.getCurrentUser()
  };
}

export default useAuth;
