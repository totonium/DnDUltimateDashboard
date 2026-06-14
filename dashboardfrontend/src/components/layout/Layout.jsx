import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import Sidebar from './Sidebar'
import Header from './Header'
import { useUIStore, useAuthStore, useStatblockStore, useAudioStore } from '../../stores'

export function Layout() {
  const { theme } = useUIStore()
  const { init, isAuthenticated } = useAuthStore()
  const { syncStatblocks } = useStatblockStore()
  const { syncAudioTracks, syncPlaylists, loadAudioTracks, loadPlaylists, processSyncQueue } = useAudioStore()
  const syncIntervalRef = useRef(null)
  const location = useLocation()

  const isLoginPage = location.pathname === '/login'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const unsubscribe = init()
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [init])

  useEffect(() => {
    if (isAuthenticated) {
      syncStatblocks()
      syncAudioTracks()
      syncPlaylists().then(() => processSyncQueue())
      loadAudioTracks()
      loadPlaylists()

      syncIntervalRef.current = setInterval(() => {
        processSyncQueue()
      }, 60000)
    }
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
    }
  }, [isAuthenticated, syncStatblocks, syncAudioTracks, syncPlaylists, loadAudioTracks, loadPlaylists, processSyncQueue])

  return (
    <div className="flex h-screen bg-surface-base text-text-primary overflow-hidden">
      {!isLoginPage && (
        <div className="flex-none h-full">
          <Sidebar />
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {!isLoginPage && <Header />}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
