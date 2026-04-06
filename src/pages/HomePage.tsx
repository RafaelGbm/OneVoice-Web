import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { Music, List, Calendar, Users, ClipboardList, ChevronRight } from 'lucide-react'

export function HomePage() {
  const { currentMinistry, songs, setlists, members, refreshSongs, refreshSetlists, refreshMembers } = useApp()

  useEffect(() => {
    refreshSongs()
    refreshSetlists()
    refreshMembers()
  }, [refreshSongs, refreshSetlists, refreshMembers])

  const nextSetlist = setlists
    .filter((s) => s.status !== 'archived' && new Date(s.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  const stats = [
    { label: 'Músicas', value: songs.length, icon: Music, to: '/songs', color: 'text-primary-light' },
    { label: 'Setlists', value: setlists.length, icon: List, to: '/setlists', color: 'text-blue-400' },
    { label: 'Membros', value: members.length, icon: Users, to: '/members', color: 'text-green-400' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {currentMinistry ? `Olá, ${currentMinistry.name}` : 'Início'}
        </h1>
        {currentMinistry?.churchName && (
          <p className="text-muted text-sm mt-1">{currentMinistry.churchName}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to} className="card hover:border-primary/40 transition-colors group">
            <Icon size={20} className={`${color} mb-2`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-muted text-sm">{label}</p>
          </Link>
        ))}
      </div>

      {/* Próximo culto */}
      {nextSetlist && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Calendar size={16} className="text-primary-light" />
              Próximo culto
            </h2>
            <Link to="/setlists" className="text-xs text-muted hover:text-primary-light transition-colors flex items-center gap-1">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          <div className="bg-surface rounded-lg p-3">
            <p className="font-medium text-white">{nextSetlist.title}</p>
            <p className="text-muted text-sm mt-1">
              {new Date(nextSetlist.date).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge bg-primary-ghost text-primary-light border border-primary/20">
                <Music size={10} />
                {nextSetlist.songs?.length ?? 0} músicas
              </span>
              <span
                className={`badge ${
                  nextSetlist.status === 'published'
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-warning/10 text-warning border border-warning/20'
                }`}
              >
                {nextSetlist.status === 'published' ? 'Publicado' : 'Rascunho'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="card">
        <h2 className="font-semibold text-white mb-3">Acesso rápido</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { to: '/songs', label: 'Biblioteca de músicas', icon: Music },
            { to: '/setlists', label: 'Gerenciar setlists', icon: List },
            { to: '/escala', label: 'Escala de membros', icon: ClipboardList },
            { to: '/members', label: 'Equipe', icon: Users },
          ].map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 px-3 py-2.5 bg-surface hover:bg-surface-alt rounded-lg transition-colors text-sm text-white"
            >
              <Icon size={16} className="text-primary-light shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
