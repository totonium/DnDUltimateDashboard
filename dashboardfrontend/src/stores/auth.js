import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authService } from '../services/authService'
import { router } from '../routes'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      userId: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      pendingDeviceId: null,
      devices: [],

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
            router.navigate({ to: '/dm/dashboard' })
          }
          return response
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
            router.navigate({ to: '/dm/dashboard' })
          }
          return response
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      loginWithDevice: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.loginWithDevice()
          if (response.token && response.approved) {
            set({ 
              user: { id: response.id, email: response.email },
              userId: response.id,
              isAuthenticated: true,
              isLoading: false,
              pendingDeviceId: null
            })
          } else if (response.deviceId && !response.approved) {
            set({ 
              pendingDeviceId: response.deviceId,
              error: response.message,
              isLoading: false
            })
          }
          return response
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Device login failed'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      registerDevice: async (approvalCode = null) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.registerDevice(approvalCode)
          if (response.token && response.approved) {
            set({ 
              user: { id: response.id, email: response.email },
              userId: response.id,
              isAuthenticated: true,
              isLoading: false,
              pendingDeviceId: null
            })
          } else if (response.deviceId && !response.approved) {
            set({ 
              pendingDeviceId: response.deviceId,
              error: response.message,
              isLoading: false
            })
          }
          return response
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Device registration failed'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      approveDevice: async (approvalCode) => {
        set({ isLoading: true, error: null })
        try {
          await authService.approveDevice(approvalCode)
          await get().refreshDevices()
          set({ isLoading: false })
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Device approval failed'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      refreshDevices: async () => {
        try {
          const devices = await authService.getDevices()
          set({ devices })
        } catch (error) {
          console.error('Failed to refresh devices:', error)
        }
      },

      revokeDevice: async (deviceId) => {
        set({ isLoading: true, error: null })
        try {
          await authService.revokeDevice(deviceId)
          await get().refreshDevices()
          set({ isLoading: false })
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to revoke device'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      generateApprovalCode: async (deviceId) => {
        try {
          const code = await authService.generateApprovalCode(deviceId)
          return code
        } catch (error) {
          console.error('Failed to generate approval code:', error)
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null })
        try {
          await authService.logout()
          set({ user: null, userId: null, isAuthenticated: false, isLoading: false, pendingDeviceId: null, devices: [] })
          router.navigate({ to: '/login' })
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      trustCurrentDevice: async () => {
        set({ isLoading: true, error: null })
        try {
          await authService.trustCurrentDevice()
          await get().refreshDevices()
          set({ isLoading: false })
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to trust device'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
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
