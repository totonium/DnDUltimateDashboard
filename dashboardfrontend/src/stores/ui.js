import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeMode: 'dm',
      theme: 'dark',
      notifications: [],
      modals: [],
      toasts: [],

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open })
      },

      toggleSidebarCollapse: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      setActiveMode: (mode) => {
        set({ activeMode: mode })
      },

      setTheme: (theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
      },

      addNotification: (notification) => {
        const id = Date.now().toString()
        const newNotification = {
          id,
          ...notification,
          createdAt: new Date().toISOString()
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications]
        }))
        return id
      },

      dismissNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      },

      clearNotifications: () => {
        set({ notifications: [] })
      },

      openModal: (modal) => {
        const id = Date.now().toString()
        const newModal = { id, ...modal }
        set((state) => ({
          modals: [...state.modals, newModal]
        }))
        return id
      },

      closeModal: (id) => {
        set((state) => ({
          modals: id ? state.modals.filter(m => m.id !== id) : state.modals.slice(0, -1)
        }))
      },

      closeAllModals: () => {
        set({ modals: [] })
      },

      addToast: (toast) => {
        const id = Date.now().toString()
        const newToast = {
          id,
          ...toast,
          duration: toast.duration || 3000
        }
        set((state) => ({
          toasts: [...state.toasts, newToast]
        }))
        
        if (newToast.duration > 0) {
          setTimeout(() => {
            get().dismissToast(id)
          }, newToast.duration)
        }
        
        return id
      },

      dismissToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }))
      }
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
        activeMode: state.activeMode,
        theme: state.theme
      })
    }
  )
)

export default useUIStore
