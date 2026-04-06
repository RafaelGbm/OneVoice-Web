import { NavLink } from 'react-router-dom'
import {
  Home,
  Music,
  List,
  Calendar,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { clsx } from 'clsx'
import { useState } from 'react'

const navItems = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/songs', label: 'Músicas', icon: Music },
  { to: '/setlists', label: 'Setlists', icon: List },
  { to: '/calendar', label: 'Calendário', icon: Calendar },
  { to: '/escala', label: 'Escala', icon: ClipboardList },
  { to: '/members', label: 'Membros', icon: Users },
  { to: '/settings', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, currentMinistry, ministries, setCurrentMinistry, signOut } = useApp()
  const [ministryMenuOpen, setMinistryMenuOpen] = useState(false)

  return (
    <aside
      className={clsx(
        'fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col bg-card border-r border-border transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-border shrink-0">
        <img src="/onevoice-icon.png" alt="OneVoice" className="w-8 h-8 rounded-lg object-cover" />
        <span className="font-bold text-lg text-white">OneVoice</span>
      </div>

      {/* Ministry selector */}
      {currentMinistry && (
        <div className="px-3 py-3 border-b border-border">
          <button
            onClick={() => setMinistryMenuOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-md bg-primary-ghost border border-primary/30 flex items-center justify-center text-primary-light text-xs font-bold shrink-0">
              {currentMinistry.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentMinistry.name}</p>
              {currentMinistry.churchName && (
                <p className="text-xs text-muted truncate">{currentMinistry.churchName}</p>
              )}
            </div>
            {ministries.length > 1 && (
              <ChevronDown
                size={14}
                className={clsx('text-muted transition-transform', ministryMenuOpen && 'rotate-180')}
              />
            )}
          </button>

          {ministryMenuOpen && ministries.length > 1 && (
            <div className="mt-1 space-y-0.5">
              {ministries.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setCurrentMinistry(m)
                    setMinistryMenuOpen(false)
                    onClose()
                  }}
                  className={clsx(
                    'w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors',
                    m.id === currentMinistry.id
                      ? 'bg-primary-ghost text-primary-light'
                      : 'text-muted hover:text-white hover:bg-surface',
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-ghost text-primary-light'
                  : 'text-muted hover:text-white hover:bg-surface',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-xs font-bold text-primary-light shrink-0">
            {user?.email?.[0].toUpperCase() ?? '?'}
          </div>
          <p className="flex-1 text-xs text-muted truncate">{user?.email}</p>
          <button
            onClick={signOut}
            className="text-muted hover:text-error transition-colors"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
