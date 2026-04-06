/**
 * Painel do Líder — métricas e visão geral do ministério
 * Portado do LeaderDashboardScreen do app mobile
 */
import { useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { useNavigate } from 'react-router-dom'
import {
  Music, Users, List, CheckCircle, Shield, BarChart2,
  Lock, Plus, Calendar,
} from 'lucide-react'
import { clsx } from 'clsx'

export function LeaderDashboardPage() {
  const { songs, setlists, members, currentMinistry, currentMember, isAdmin } = useApp()
  const navigate = useNavigate()

  const totalSongs = songs.length
  const activeMembers = members.filter((m) => m.isActive)
  const totalMembers = activeMembers.length
  const totalSetlists = setlists.length
  const publishedSetlists = setlists.filter((s) => s.status === 'published').length

  const now = Date.now()
  const nextSetlist = useMemo(
    () =>
      setlists
        .filter((s) => new Date(s.date).getTime() >= now - 86400000)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setlists],
  )

  // Top 5 músicas mais usadas
  const songUsage = useMemo(() => {
    const map: Record<string, { title: string; artist?: string; count: number }> = {}
    for (const setlist of setlists) {
      for (const ss of setlist.songs || []) {
        const song = ss.song
        if (!song) continue
        if (!map[song.id]) map[song.id] = { title: song.title, artist: song.artist, count: 0 }
        map[song.id].count++
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
  }, [setlists])

  // Breakdown de roles
  const roleCount = useMemo(() => {
    const counts = { owner: 0, admin: 0, member: 0 }
    for (const m of activeMembers) {
      if (m.roles.includes('owner')) counts.owner++
      else if (m.roles.includes('admin')) counts.admin++
      else counts.member++
    }
    return counts
  }, [activeMembers])

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <Lock size={40} className="text-border" />
        <h2 className="text-xl font-bold text-white">Acesso restrito</h2>
        <p className="text-muted max-w-sm">
          Apenas administradores e líderes podem ver o painel de métricas.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Painel do Líder</h1>
          <div className="flex items-center gap-2 mt-1">
            <Shield size={13} className="text-primary-light" />
            <span className="text-sm text-muted">{currentMinistry?.name}</span>
            {currentMember?.roles.includes('owner') && (
              <span className="badge bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs">Owner</span>
            )}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard icon={Music} label="Músicas" value={totalSongs} color="text-primary-light" bg="bg-primary/10" />
        <MetricCard icon={Users} label="Membros" value={totalMembers} color="text-success" bg="bg-success/10" />
        <MetricCard icon={List} label="Setlists" value={totalSetlists} color="text-purple-400" bg="bg-purple-500/10" />
        <MetricCard icon={CheckCircle} label="Publicados" value={publishedSetlists} color="text-warning" bg="bg-warning/10" />
      </div>

      {/* Próximo setlist */}
      <section>
        <SectionTitle>Próximo Setlist</SectionTitle>
        {nextSetlist ? (
          <button
            onClick={() => navigate('/setlists')}
            className="w-full card text-left hover:border-primary/40 transition-colors flex items-center gap-4"
          >
            <div className="shrink-0 text-center w-12">
              <p className="text-2xl font-bold text-primary-light leading-none">
                {new Date(nextSetlist.date).getDate()}
              </p>
              <p className="text-xs text-muted capitalize">
                {new Date(nextSetlist.date).toLocaleDateString('pt-BR', { month: 'short' })}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{nextSetlist.title}</p>
              <p className="text-sm text-muted mt-0.5 capitalize">
                {new Date(nextSetlist.date).toLocaleDateString('pt-BR', {
                  weekday: 'long', day: '2-digit', month: 'long',
                })}
              </p>
              <p className="text-xs text-muted mt-0.5">{nextSetlist.songs?.length ?? 0} música(s)</p>
            </div>
            <span className={clsx(
              'badge border shrink-0',
              nextSetlist.status === 'published'
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-warning/10 text-warning border-warning/20',
            )}>
              {nextSetlist.status === 'published' ? 'Publicado' : 'Rascunho'}
            </span>
          </button>
        ) : (
          <div className="card flex flex-col items-center gap-3 py-8 text-center">
            <Calendar size={32} className="text-border" />
            <p className="text-muted text-sm">Nenhum setlist agendado</p>
            <button onClick={() => navigate('/setlists')} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} /> Criar setlist
            </button>
          </div>
        )}
      </section>

      {/* Músicas mais usadas */}
      <section>
        <SectionTitle>Músicas mais usadas</SectionTitle>
        {songUsage.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-muted text-sm">Nenhum dado disponível ainda. Crie setlists para ver estatísticas.</p>
          </div>
        ) : (
          <div className="card divide-y divide-border p-0 overflow-hidden">
            {songUsage.map(([id, info], idx) => (
              <div key={id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm font-bold text-primary-light w-7 shrink-0">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{info.title}</p>
                  {info.artist && <p className="text-xs text-muted truncate">{info.artist}</p>}
                </div>
                <span className="badge bg-primary/10 text-primary-light border border-primary/20 text-xs shrink-0">
                  {info.count}x
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Equipe */}
      <section>
        <SectionTitle>Equipe</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-400">{roleCount.owner}</p>
            <p className="text-xs text-muted mt-1">Owner(s)</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-primary-light">{roleCount.admin}</p>
            <p className="text-xs text-muted mt-1">Admin(s)</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-success">{roleCount.member}</p>
            <p className="text-xs text-muted mt-1">Membros</p>
          </div>
        </div>
      </section>

      {/* Ações rápidas */}
      <section>
        <SectionTitle>Ações rápidas</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ActionCard icon={Plus} label="Novo Setlist" onClick={() => navigate('/setlists')} />
          <ActionCard icon={Music} label="Biblioteca" onClick={() => navigate('/songs')} />
          <ActionCard icon={Users} label="Membros" onClick={() => navigate('/members')} />
          <ActionCard icon={BarChart2} label="Auto Escala" onClick={() => navigate('/auto-scale')} />
        </div>
      </section>
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{children}</h2>
  )
}

function MetricCard({
  icon: Icon, label, value, color, bg,
}: {
  icon: typeof Music
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-4">
      <div className={clsx('p-2 rounded-lg', bg)}>
        <Icon size={18} className={color} />
      </div>
      <p className={clsx('text-3xl font-black', color)}>{value}</p>
      <p className="text-xs text-muted font-semibold">{label}</p>
    </div>
  )
}

function ActionCard({ icon: Icon, label, onClick }: { icon: typeof Music; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card flex flex-col items-center gap-2 py-4 hover:border-primary/40 transition-colors"
    >
      <Icon size={20} className="text-primary-light" />
      <span className="text-xs font-semibold text-white">{label}</span>
    </button>
  )
}
