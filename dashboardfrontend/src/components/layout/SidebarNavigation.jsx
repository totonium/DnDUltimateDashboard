import { useNavigate, useLocation } from '@tanstack/react-router'
import clsx from 'clsx'
import {
  Sword,
  Scroll,
  Music,
  Settings,
  LayoutDashboard,
  FileText,
  Users,
  Package
} from 'lucide-react'
import './SidebarNavigation.css'

const dmNavigation = [
  { name: 'Combat', to: '/dm/combat', icon: Sword, description: 'Initiative tracker' },
  { name: 'Statblocks', to: '/dm/statblocks', icon: Scroll, description: 'Monster library' },
  { name: 'Music & SFX', to: '/dm/audio', icon: Music, description: 'Audio player' },
  { name: 'Session Notes', to: '/dm/notes', icon: FileText, description: 'Obsidian vault reader' },
  { name: 'Settings', to: '/settings', icon: Settings, description: 'Dashboard settings' },
]

const playerNavigation = [
  { name: 'Dashboard', to: '/player/dashboard', icon: LayoutDashboard, description: 'Your overview' },
  { name: 'Character', to: '/player/character', icon: Users, description: 'Your character' },
  { name: 'Spells', to: '/player/spells', icon: Scroll, description: 'Spell descriptions' },
  { name: 'Items', to: '/player/items', icon: Package, description: 'Inventory' },
  { name: 'Settings', to: '/settings', icon: Settings, description: 'Settings' },
]

function NavItem({ item, collapsed, onNavigate }) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = location.pathname === item.to

  const handleClick = (e) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate()
    }
    navigate({ to: item.to })
  }

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'sidebar-nav-item',
        isActive ? 'active' : '',
        collapsed ? 'collapsed' : ''
      )}
      title={collapsed ? item.name : undefined}
    >
      <item.icon size={20} />
      {!collapsed && (
        <span>{item.name}</span>
      )}
    </button>
  )
}

export function SidebarNavigation({ activeMode, collapsed, onNavigate }) {
  const getCurrentNav = () => {
    if (activeMode === 'dm') return dmNavigation
    if (activeMode === 'player') return playerNavigation
    return []
  }

  return (
    <nav className="sidebar-nav">
      <div className="sidebar-nav-items">
        {getCurrentNav().map((item) => (
          <NavItem
            key={item.name}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  )
}

export default SidebarNavigation
