import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../lib/firebase'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      userId: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      init: () => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          set({ 
            user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
            userId: user?.uid || null,
            isAuthenticated: !!user,
            isLoading: false
          })
        })
        return unsubscribe
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const result = await signInWithEmailAndPassword(auth, email, password)
          set({ 
            user: { uid: result.user.uid, email: result.user.email },
            userId: result.user.uid,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      register: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password)
          set({ 
            user: { uid: result.user.uid, email: result.user.email },
            userId: result.user.uid,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await signOut(auth)
          set({ user: null, userId: null, isAuthenticated: false })
        } catch (error) {
          set({ error: error.message })
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
