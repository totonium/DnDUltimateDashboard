import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authService } from '../services/authService'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      userId: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      init: async () => {
        set({ isLoading: true, error: null })
        try {
          const user = await authService.init()
          set({ 
            user: user ? { id: user.id, email: user.email } : null,
            userId: user?.id || null,
            isAuthenticated: !!user,
            isLoading: false
          })
        } catch (error) {
          set({ error: error.message, isLoading: false })
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.signIn(email, password)
          if (response.token) {
            set({ 
              user: { id: response.id || 'temp', email: response.email || email },
              userId: response.id || 'temp',
              isAuthenticated: true,
              isLoading: false
            })
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      register: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.signUp(email, password)
          if (response.token) {
            set({ 
              user: { id: response.id || 'temp', email: response.email || email },
              userId: response.id || 'temp',
              isAuthenticated: true,
              isLoading: false
            })
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null })
        try {
          await authService.logout()
          set({ user: null, userId: null, isAuthenticated: false, isLoading: false })
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, userId: state.userId, isAuthenticated: state.isAuthenticated })
    }
  )
)

export default useAuthStore
