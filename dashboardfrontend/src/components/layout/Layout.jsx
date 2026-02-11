import { useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import Sidebar from './Sidebar'
import Header from './Header'
import { useUIStore, useAuthStore } from '../../stores'

export function Layout() {
  const { theme } = useUIStore()
  const { init } = useAuthStore()

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

  return (
    <div className="flex h-screen bg-surface-base text-text-primary overflow-hidden">
      <div className="flex-none h-full">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
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
