import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Users, Calendar, ChevronLeft, ChevronRight, Info, Smartphone } from 'lucide-react'
import { ROLE_LABELS, type TeamMember } from '@/types'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'

interface PublishedSchedule {
  id: string
  ministry_id: string
  date_key: string // YYYY-MM-DD
  slots: Record<string, string[]> // ex: { guitarist: ['João'], vocalist: ['Maria'] }
  published_at: string
}

function MemberChip({ member, isYou }: { member: TeamMember; isYou: boolean }) {
  return (
    <div className={clsx(
      'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border',
      isYou
        ? 'bg-primary/15 text-primary-light border-primary/30'
        : 'bg-surface text-white/80 border-border',
    )}>
      <div className={clsx('w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
        isYou ? 'bg-primary text-white' : 'bg-surface-alt text-muted')}>
        {member.name[0].toUpperCase()}
      </div>
      {member.name.split(' ')[0]}
      {isYou && <span className="text-primary-light/70 text-xs">você</span>}
    </div>
  )
}

function SlotRow({ label, names, userEmail, members }: {
  label: string
  names: string[]
  userEmail: string | undefined
  members: TeamMember[]
}) {
  if (names.length === 0) return null
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted w-24 shrink-0 pt-0.5">{label}</span>
      <div className="flex flex-wrap gap-1">
        {names.map((name) => {
          const member = members.find((m) => m.name === name || m.email === name)
          const isYou = member?.email === userEmail
          if (member) return <MemberChip key={name} member={member} isYou={isYou} />
          return <span key={name} className="text-xs text-white/80">{name}</span>
        })}
      </div>
    </div>
  )
}

const SLOT_LABELS: Record<string, string> = {
  vocalist: 'Vocal',
  guitarist: 'Guitarra',
  acoustic_guitarist: 'Violão',
  bassist: 'Baixo',
  drummer: 'Bateria',
  keyboardist: 'Teclado',
  minister: 'Ministro(a)',
  soprano: 'Soprano',
  contralto: 'Contralto',
  tenor: 'Tenor',
  baixo_vocal: 'Baixo vocal',
}

export function EscalaPage() {
  const { setlists, members, user, refreshSetlists, refreshMembers, currentMinistry } = useApp()
  const [schedules, setSchedules] = useState<PublishedSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    refreshSetlists()
    refreshMembers()
  }, [refreshSetlists, refreshMembers])

  useEffect(() => {
    if (!currentMinistry) return
    loadSchedules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMinistry?.id])

  async function loadSchedules() {
    if (!currentMinistry) return
    setLoading(true)
    const { data } = await supabase
      .from('published_schedules')
      .select('*')
      .eq('ministry_id', currentMinistry.id)
      .order('date_key', { ascending: false })
      .limit(12)
    setSchedules((data as PublishedSchedule[]) ?? [])
    setLoading(false)
  }

  // Próximas 4 semanas a partir do offset
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingSetlists = setlists
    .filter((s) => s.status !== 'archived' && new Date(s.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Semanas para exibir
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + (weekOffset + i) * 7)
    // Achar próximo domingo
    const sunday = new Date(d)
    sunday.setDate(sunday.getDate() + (7 - sunday.getDay()) % 7)
    return sunday
  })

  function toDateKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function getScheduleForDate(date: Date): PublishedSchedule | undefined {
    return schedules.find((s) => s.date_key === toDateKey(date))
  }

  function getSetlistForDate(date: Date) {
    const key = toDateKey(date)
    return upcomingSetlists.find((s) => {
      const d = new Date(s.date)
      return toDateKey(d) === key
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Escala</h1>
          <p className="text-muted text-sm">Próximas escalas do ministério</p>
        </div>
        {/* Navegação de semanas */}
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((o) => Math.max(0, o - 1))} disabled={weekOffset === 0}
            className="p-1.5 rounded-lg bg-surface hover:bg-surface-alt text-muted hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-muted">Semanas</span>
          <button onClick={() => setWeekOffset((o) => o + 1)}
            className="p-1.5 rounded-lg bg-surface hover:bg-surface-alt text-muted hover:text-white transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Cards das semanas */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {weeks.map((sunday) => {
            const schedule = getScheduleForDate(sunday)
            const setlist = getSetlistForDate(sunday)
            const dateKey = toDateKey(sunday)
            const isThisWeek = dateKey === toDateKey((() => {
              const s = new Date(today)
              s.setDate(s.getDate() + (7 - s.getDay()) % 7)
              return s
            })())
            const isUserInSchedule = schedule
              ? Object.values(schedule.slots).some((names) =>
                  names.some((n) => {
                    const m = members.find((m) => m.name === n || m.email === n)
                    return m?.email === user?.email
                  })
                )
              : false

            return (
              <div key={dateKey} className={clsx('card space-y-3', isThisWeek && 'border-primary/30')}>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary-light" />
                      <span className="text-xs text-muted uppercase tracking-wide">
                        {isThisWeek ? 'Esta semana' : sunday.toLocaleDateString('pt-BR', { weekday: 'long' })}
                      </span>
                    </div>
                    <p className="font-semibold text-white mt-0.5">
                      {sunday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isUserInSchedule && (
                      <span className="badge bg-primary/10 text-primary-light border border-primary/20 text-xs">você</span>
                    )}
                    {setlist && (
                      <span className={clsx('badge border text-xs',
                        setlist.status === 'published'
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-warning/10 text-warning border-warning/20')}>
                        {setlist.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Setlist */}
                {setlist && (
                  <div className="bg-surface rounded-lg px-3 py-2">
                    <p className="text-sm text-white font-medium truncate">{setlist.title}</p>
                    {(setlist.songs?.length ?? 0) > 0 && (
                      <p className="text-xs text-muted mt-0.5">{setlist.songs!.length} músicas</p>
                    )}
                  </div>
                )}

                {/* Escala */}
                {schedule ? (
                  <div className="space-y-0">
                    {Object.entries(schedule.slots).map(([role, names]) => (
                      <SlotRow
                        key={role}
                        label={SLOT_LABELS[role] ?? role}
                        names={names}
                        userEmail={user?.email}
                        members={members}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <Info size={14} className="text-muted shrink-0" />
                    <p className="text-muted text-xs">Escala não publicada</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Equipe */}
      <div className="card">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Users size={15} className="text-primary-light" />
          Equipe ({members.length} membros)
        </h2>
        {members.length === 0 ? (
          <p className="text-muted text-sm">Nenhum membro cadastrado</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-primary-ghost border border-primary/20 flex items-center justify-center text-xs text-primary-light font-bold shrink-0">
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-white leading-none">{m.name.split(' ')[0]}</p>
                  <p className="text-xs text-muted">{m.roles.slice(0, 2).map((r) => ROLE_LABELS[r] ?? r).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banner app mobile */}
      <div className="card bg-primary-ghost border-primary/20">
        <div className="flex items-start gap-3">
          <Smartphone size={20} className="text-primary-light shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-white">Geração automática de escala</p>
            <p className="text-muted text-sm mt-1">
              A IA que gera escalas balanceadas está no app mobile OneVoice. Ela considera disponibilidade, perfil musical, naipes vocais e histórico de escalas para criar uma distribuição equilibrada.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
