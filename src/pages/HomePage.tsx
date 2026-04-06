import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { Music, List, Calendar, Users, ClipboardList, ChevronRight, TrendingUp, Clock } from 'lucide-react'
import { clsx } from 'clsx'

function daysUntil(date: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - now.getTime()) / 86400000)
}

export function HomePage() {
  const { currentMinistry, songs, setlists, members, user, refreshSongs, refreshSetlists, refreshMembers } = useApp()

  useEffect(() => {
    refreshSongs()
    refreshSetlists()
    refreshMembers()
  }, [refreshSongs, refreshSetlists, refreshMembers])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingSetlists = setlists
    .filter((s) => s.status !== 'archived' && new Date(s.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const nextSetlist = upcomingSetlists[0] ?? null
  const daysLeft = nextSetlist ? daysUntil(new Date(nextSetlist.date)) : null

  const recentSetlists = [...setlists]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  const publishedCount = setlists.filter((s) => s.status === 'published').length

  const userName = user?.user_metadata?.name as string | undefined

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Saudação */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {userName ? `Olá, ${userName.split(' ')[0]}!` : 'Olá!'}
          </h1>
          {currentMinistry && (
            <p className="text-muted text-sm mt-0.5">
              {currentMinistry.name}
              {currentMinistry.churchName && ` · ${currentMinistry.churchName}`}
            </p>
          )}
        </div>
        <div className="text-right text-sm text-muted">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Próximo culto — destaque */}
      {nextSetlist ? (
        <div className={clsx(
          'rounded-xl p-5 border',
          daysLeft === 0
            ? 'bg-primary/10 border-primary/30'
            : daysLeft != null && daysLeft <= 3
              ? 'bg-warning/5 border-warning/20'
              : 'bg-card border-border',
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-primary-light shrink-0" />
                <span className="text-xs text-muted uppercase tracking-wide">Próximo culto</span>
              </div>
              <h2 className="text-xl font-bold text-white truncate">{nextSetlist.title}</h2>
              <p className="text-muted text-sm mt-1 capitalize">
                {new Date(nextSetlist.date).toLocaleDateString('pt-BR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="badge bg-primary-ghost text-primary-light border border-primary/20">
                  <Music size={10} /> {nextSetlist.songs?.length ?? 0} músicas
                </span>
                <span className={clsx('badge border', nextSetlist.status === 'published'
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-warning/10 text-warning border-warning/20')}>
                  {nextSetlist.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
            </div>

            {/* Contagem regressiva */}
            {daysLeft != null && (
              <div className={clsx(
                'shrink-0 text-center rounded-xl px-4 py-3 border',
                daysLeft === 0
                  ? 'bg-primary border-primary/50'
                  : daysLeft <= 3
                    ? 'bg-warning/10 border-warning/30'
                    : 'bg-surface border-border',
              )}>
                <p className={clsx('text-3xl font-bold leading-none',
                  daysLeft === 0 ? 'text-white' : daysLeft <= 3 ? 'text-warning' : 'text-primary-light')}>
                  {daysLeft}
                </p>
                <p className={clsx('text-xs mt-1', daysLeft === 0 ? 'text-white/80' : 'text-muted')}>
                  {daysLeft === 0 ? 'hoje!' : daysLeft === 1 ? 'dia' : 'dias'}
                </p>
              </div>
            )}
          </div>

          <Link to="/setlists" className="inline-flex items-center gap-1 mt-4 text-sm text-primary-light hover:underline">
            Ver todos os setlists <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Nenhum culto agendado</p>
            <p className="text-muted text-sm mt-0.5">Crie um setlist para começar</p>
          </div>
          <Link to="/setlists" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Criar setlist
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Músicas', value: songs.length, icon: Music, to: '/songs', color: 'text-primary-light' },
          { label: 'Setlists', value: setlists.length, icon: List, to: '/setlists', color: 'text-blue-400' },
          { label: 'Publicados', value: publishedCount, icon: TrendingUp, to: '/setlists', color: 'text-success' },
          { label: 'Membros', value: members.length, icon: Users, to: '/members', color: 'text-orange-400' },
        ].map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to} className="card hover:border-primary/30 transition-colors group text-center">
            <Icon size={20} className={clsx(color, 'mx-auto mb-2')} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-muted text-xs">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Setlists recentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Clock size={15} className="text-primary-light" /> Recentes
            </h2>
            <Link to="/setlists" className="text-xs text-muted hover:text-primary-light transition-colors flex items-center gap-1">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          {recentSetlists.length === 0 ? (
            <p className="text-muted text-sm text-center py-4">Nenhum setlist ainda</p>
          ) : (
            <div className="space-y-2">
              {recentSetlists.map((s) => (
                <Link key={s.id} to="/setlists"
                  className="flex items-center gap-3 p-2 bg-surface hover:bg-surface-alt rounded-lg transition-colors">
                  <div className="text-center shrink-0 w-8">
                    <p className="text-sm font-bold text-primary-light leading-none">{new Date(s.date).getDate()}</p>
                    <p className="text-xs text-muted">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][new Date(s.date).getDay()]}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{s.title}</p>
                    <p className="text-xs text-muted">{s.songs?.length ?? 0} músicas</p>
                  </div>
                  <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0',
                    s.status === 'published' ? 'bg-success' : 'bg-warning')} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Acesso rápido */}
        <div className="card">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <ClipboardList size={15} className="text-primary-light" /> Acesso rápido
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/songs', label: 'Biblioteca', icon: Music, desc: `${songs.length} músicas` },
              { to: '/setlists', label: 'Setlists', icon: List, desc: `${setlists.length} setlists` },
              { to: '/escala', label: 'Escala', icon: ClipboardList, desc: `${members.length} membros` },
              { to: '/calendar', label: 'Calendário', icon: Calendar, desc: 'Disponibilidade' },
            ].map(({ to, label, icon: Icon, desc }) => (
              <Link key={to} to={to}
                className="flex flex-col gap-1 p-3 bg-surface hover:bg-surface-alt rounded-lg transition-colors">
                <Icon size={18} className="text-primary-light" />
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-muted">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper local (evita import circular)
function Plus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
