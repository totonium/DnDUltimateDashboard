import { useEffect, useState } from 'react'
import { Bell, Search, Cloud, CloudOff, User, LogOut, ChevronDown, ChevronLeft, ChevronRight, } from 'lucide-react'
import { useUIStore, useAuthStore } from '../../stores'
import { useClickOutside } from '../../hooks/useClickOutside'
import clsx from 'clsx'
import './Header.css'

export function Header() {
  const { notifications, toggleSidebar, toggleSidebarCollapse, sidebarCollapsed } = useUIStore()
  const { user, logout, isAuthenticated } = useAuthStore()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const notificationsRef = useClickOutside(() => setShowNotifications(false))
  const userMenuRef = useClickOutside(() => setShowUserMenu(false))

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="sidebar-collapse-btn"
          onClick={toggleSidebarCollapse}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="header-right">
        <div className={clsx(
          'header-status',
          isOnline ? 'success' : 'warning'
        )}>
          {isOnline ? (
            <Cloud className="success" />
          ) : (
            <CloudOff className="warning" />
          )}
          <span className={clsx(
            'header-status-text',
            isOnline ? 'success' : 'warning'
          )}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div ref={notificationsRef} className="header-notifications">
          <button
            className="header-notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell />
            {unreadCount > 0 && (
              <span className="header-notifications-badge">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="header-dropdown">
              <div className="header-dropdown-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <span className="header-dropdown-count">{unreadCount} unread</span>
                )}
              </div>
              <div className="header-dropdown-content">
                {notifications.length === 0 ? (
                  <div className="header-dropdown-empty">
                    <Bell />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className="header-dropdown-item"
                    >
                      <p>{notification.message}</p>
                      <span>
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div ref={userMenuRef} className="header-user">
            <button
              className="header-user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="header-user-avatar">
                <User />
              </div>
              <span className="header-user-name">
                {user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown />
            </button>

            {showUserMenu && (
              <div className="header-user-dropdown">
                <div className="header-user-info">
                  <p>{user?.email || 'User'}</p>
                  <span>Signed in</span>
                </div>
                <div className="header-user-menu">
                  <button
                    onClick={() => {
                      logout()
                      setShowUserMenu(false)
                    }}
                  >
                    <LogOut />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
