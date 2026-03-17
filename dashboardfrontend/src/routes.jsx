import { createRouter, createRootRoute, createRoute, Outlet, redirect } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { Layout } from './components/layout'
import { Sword, Scroll, Music, BookOpen, Users, Dices, Sparkles, LayoutDashboard, Shield, Package, FileText, LogIn } from 'lucide-react'
import { AudioLibrary } from './components/audio'
import { VaultBrowser } from './components/obsidian'
import { InitiativeTracker } from './components/initiative'
import { StatblockLibrary } from './components/statblocks'
import { LoginPage } from './components/auth/LoginPage'
import { DeviceManager } from './components/auth/DeviceManager'
import { useAuthStore } from './stores/auth'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()
  
  if (isLoading) {
    return null
  }
  
  if (!isAuthenticated) {
    navigate({ to: '/login' })
    return null
  }
  
  return children
}

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()
  
  if (isLoading) {
    return null
  }
  
  if (isAuthenticated) {
    navigate({ to: '/dm/dashboard' })
    return null
  }
  
  return children
}

const RootComponent = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

const rootRoute = createRootRoute({
  component: RootComponent,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: function Login() {
    return (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    )
  },
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Home() {
    return (
      <div className="landing-page">
        <div className="landing-hero">
          <h1 className="landing-title">DnD Ultimate Dashboard</h1>
          <p className="landing-subtitle">
            Your personal command center for running unforgettable D&D 5e sessions.
            Track combat, manage statblocks, set the atmosphere with music, and organize your notes.
          </p>
          <div className="landing-actions">
            <a href="/dm/dashboard" className="btn btn-primary btn-lg">
              <LayoutDashboard size={20} />
              Dashboard
            </a>
            <a href="/dm/combat" className="btn btn-secondary btn-lg">
              <Sword size={20} />
              Start Combat
            </a>
          </div>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon combat">
              <Sword size={24} />
            </div>
            <h3 className="feature-title">Initiative Tracker</h3>
            <p className="feature-description">
              Track combat encounters with ease. Add creatures, roll initiative, and manage turns seamlessly.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon magic">
              <Scroll size={24} />
            </div>
            <h3 className="feature-title">Statblock Library</h3>
            <p className="feature-description">
              Build your monster collection. Store and organize creature statblocks for quick access during sessions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon audio">
              <Music size={24} />
            </div>
            <h3 className="feature-title">Music & Sound Effects</h3>
            <p className="feature-description">
              Set the perfect atmosphere with a built-in audio player. Ambient tracks and sound effects at your fingertips.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon notes">
              <BookOpen size={24} />
            </div>
            <h3 className="feature-title">Session Notes</h3>
            <p className="feature-description">
              Keep your campaign organized. Access your Obsidian vault and never lose track of a plot thread.
            </p>
          </div>
        </div>
      </div>
    )
  },
})

// DM Routes
const dmDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dm/dashboard',
  component: function DmDashboard() {
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <div className="standard-icon">
            <LayoutDashboard size={40} className="text-primary" />
          </div>
          <h1 className="standard-title">DM Dashboard</h1>
          <p className="standard-description">
            Your command center for running sessions. View party status, quick access to frequently used tools, and session overview.
          </p>
          <div className="mt-6">
            <span className="badge badge-primary badge-lg">
              <Sparkles size={14} className="mr-1" />
              Coming Soon
            </span>
          </div>
        </div>
      </ProtectedRoute>
    )
  },
})

const dmCombatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dm/combat',
  component: function Combat() {
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <InitiativeTracker />
        </div>
      </ProtectedRoute>
    )
  },
})

const dmItemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dm/items',
  component: function Items() {
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <div className="standard-icon">
            <Package size={40} className="text-gold" />
          </div>
          <h1 className="standard-title">Items & Treasure</h1>
          <p className="standard-description">
            Manage your treasure horde. Track magic items, mundane equipment, and loot distribution.
          </p>
          <div className="mt-6">
            <span className="badge badge-gold badge-lg">
              <Sparkles size={14} className="mr-1" />
              Coming Soon
            </span>
          </div>
        </div>
      </ProtectedRoute>
    )
  },
})

const dmSpellsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dm/spells',
  component: function DmSpells() {
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <div className="standard-icon">
            <Scroll size={40} className="text-magic" />
          </div>
          <h1 className="standard-title">Spell Library</h1>
          <p className="standard-description">
            Your comprehensive spell reference. Browse spells by level, school, or class for quick lookup during sessions.
          </p>
          <div className="mt-6">
            <span className="badge badge-magic badge-lg">
              <Sparkles size={14} className="mr-1" />
              Coming Soon
            </span>
          </div>
        </div>
      </ProtectedRoute>
    )
  },
})

const dmStatblocksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dm/statblocks',
  component: function Statblocks() {
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <StatblockLibrary />
        </div>
      </ProtectedRoute>
    )
  },
})

const dmAudioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dm/audio',
  component: function Audio() {
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <AudioLibrary/>
        </div>
      </ProtectedRoute>
    )
  },
})

const dmNotesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dm/notes',
  component: function Notes() {
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <VaultBrowser/>
        </div>
      </ProtectedRoute>
    )
  },
})

// Player Routes
const playerDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/player/dashboard',
  component: function PlayerDashboard() {
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <div className="standard-icon">
            <LayoutDashboard size={40} className="text-primary" />
          </div>
          <h1 className="standard-title">Player Dashboard</h1>
          <p className="standard-description">
            Your personal command center. Quick access to character stats, abilities, and party information.
          </p>
          <div className="mt-6">
            <span className="badge badge-primary badge-lg">
              <Sparkles size={14} className="mr-1" />
              Coming Soon
            </span>
          </div>
        </div>
      </ProtectedRoute>
    )
  },
})

const playerCharacterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/player/character',
  component: function Character() {
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <div className="standard-icon">
            <Users size={40} className="text-primary" />
          </div>
          <h1 className="standard-title">Your Character</h1>
          <p className="standard-description">
            Your character sheet, beautifully presented. Track abilities, inventory, and progression at a glance.
          </p>
          <div className="mt-6">
            <span className="badge badge-primary badge-lg">
              <Sparkles size={14} className="mr-1" />
              Coming Soon
            </span>
          </div>
        </div>
      </ProtectedRoute>
    )
  },
})

const playerSpellsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/player/spells',
  component: function Spells() {
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <div className="standard-icon">
            <Dices size={40} className="text-magic" />
          </div>
          <h1 className="standard-title">Spell Browser</h1>
          <p className="standard-description">
            Explore your magical repertoire. Browse spell descriptions, track prepared spells, and manage your spell slots.
          </p>
          <div className="mt-6">
            <span className="badge badge-magic badge-lg">
              <Sparkles size={14} className="mr-1" />
              Coming Soon
            </span>
          </div>
        </div>
      </ProtectedRoute>
    )
  },
})

const playerItemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/player/items',
  component: function PlayerItems() {
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <div className="standard-icon">
            <Package size={40} className="text-gold" />
          </div>
          <h1 className="standard-title">Inventory</h1>
          <p className="standard-description">
            Track your character's belongings. Manage equipment, potions, and treasure.
          </p>
          <div className="mt-6">
            <span className="badge badge-gold badge-lg">
              <Sparkles size={14} className="mr-1" />
              Coming Soon
            </span>
          </div>
        </div>
      </ProtectedRoute>
    )
  },
})

// Settings Route
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: function Settings() {
    const { user, logout } = useAuthStore()
    
    return (
      <ProtectedRoute>
        <div className="standard-page">
          <div className="standard-icon">
            <Sparkles size={40} className="text-gold" />
          </div>
          <h1 className="standard-title">Settings</h1>
          <p className="standard-description">
            Customize your dashboard experience. Manage devices, configure preferences, and account settings.
          </p>
          
          <div className="settings-sections">
            <section className="settings-section">
              <h2>Account</h2>
              <div className="settings-card">
                <div className="settings-item">
                  <div className="settings-item-info">
                    <span className="settings-item-label">Email</span>
                    <span className="settings-item-value">{user?.email || 'Not logged in'}</span>
                  </div>
                </div>
                <button className="btn btn-danger" onClick={() => logout()}>
                  <LogIn size={18} />
                  Logout
                </button>
              </div>
            </section>

            <section className="settings-section">
              <h2>Device Management</h2>
              <DeviceManager />
            </section>
          </div>
        </div>
      </ProtectedRoute>
    )
  },
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  dmDashboardRoute,
  dmCombatRoute,
  dmItemsRoute,
  dmSpellsRoute,
  dmStatblocksRoute,
  dmAudioRoute,
  dmNotesRoute,
  playerDashboardRoute,
  playerCharacterRoute,
  playerSpellsRoute,
  playerItemsRoute,
  settingsRoute,
])

export const router = createRouter({ routeTree })

export default router
