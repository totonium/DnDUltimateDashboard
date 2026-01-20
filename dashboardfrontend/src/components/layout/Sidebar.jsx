import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import {
  Sparkles,
  Menu,
  X,
} from 'lucide-react'
import { useUIStore } from '../../stores'
import { useClickOutside } from '../../hooks/useClickOutside'
import clsx from 'clsx'
import { SidebarNavigation } from './SidebarNavigation'
import './Sidebar.css'

export function Sidebar() {
  const location = useLocation()

  const { sidebarOpen, sidebarCollapsed, toggleSidebar, activeMode, setActiveMode } = useUIStore()

  const [isMobile, setIsMobile] = useState(false)

  const handleClickOutside = () => {
    if (isMobile && sidebarOpen) {
      toggleSidebar()
    }
  }

  const sidebarRef = useClickOutside(handleClickOutside)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile && sidebarOpen) {
        toggleSidebar()
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      toggleSidebar()
    }
  }, [location.pathname])

  const handleNavigation = () => {
    if (isMobile && sidebarOpen) {
      toggleSidebar()
    }
  }

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {sidebarOpen && isMobile && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        className={clsx(
          'sidebar',
          sidebarOpen ? 'open' : '',
          sidebarCollapsed ? 'collapsed' : ''
        )}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <Sparkles size={18} />
            </div>
            <h1 className="sidebar-title">
              DnD Dashboard
            </h1>
            <span className={clsx(
              'sidebar-mode-badge',
              activeMode === 'dm' ? 'dm' : 'player'
            )}>
              {activeMode === 'dm' ? 'DM' : 'Player'}
            </span>
          </div>
        </div>

        <div className="sidebar-mode-switcher">
          <button
            className={clsx(
              'sidebar-mode-btn dm',
              activeMode === 'dm' ? 'active' : ''
            )}
            onClick={() => setActiveMode('dm')}
          >
            <span>DM Mode</span>
          </button>

          <button
            className={clsx(
              'sidebar-mode-btn player',
              activeMode === 'player' ? 'active' : ''
            )}
            onClick={() => setActiveMode('player')}
          >
            <span>Player</span>
          </button>
        </div>

        <SidebarNavigation
          activeMode={activeMode}
          collapsed={sidebarCollapsed}
          onNavigate={handleNavigation}
        />

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">
            v1.0.0 - DnD 5e
          </p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
