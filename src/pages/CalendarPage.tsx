import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { ChevronLeft, ChevronRight, Music, Info } from 'lucide-react'
import { clsx } from 'clsx'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function loadUnavailability(email: string): Set<string> {
  try {
    const raw = localStorage.getItem('onevoice_unavailability')
    const map = raw ? JSON.parse(raw) : {}
    return new Set<string>(map[email] ?? [])
  } catch { return new Set() }
}

function saveUnavailability(email: string, keys: Set<string>) {
  try {
    const raw = localStorage.getItem('onevoice_unavailability')
    const map = raw ? JSON.parse(raw) : {}
    map[email] = Array.from(keys)
    localStorage.setItem('onevoice_unavailability', JSON.stringify(map))
  } catch { /* noop */ }
}

export function CalendarPage() {
  const { setlists, refreshSetlists, user } = useApp()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => { refreshSetlists() }, [refreshSetlists])

  useEffect(() => {
    if (user?.email) setUnavailable(loadUnavailability(user.email))
  }, [user?.email])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  function toggleUnavailable(day: number) {
    if (!user?.email) return
    const key = toDateKey(year, month, day)
    const next = new Set(unavailable)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setUnavailable(next)
    saveUnavailability(user.email, next)
  }

  function setlistsForDay(day: number) {
    const key = toDateKey(year, month, day)
    return setlists.filter((s) => {
      const d = new Date(s.date)
      return toDateKey(d.getFullYear(), d.getMonth(), d.getDate()) === key
    })
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedSetlists = selectedDay ? setlistsForDay(selectedDay) : []
  const selectedKey = selectedDay ? toDateKey(year, month, selectedDay) : ''
  const selectedIsUnavailable = unavailable.has(selectedKey)
  const isSunday = selectedDay ? new Date(year, month, selectedDay).getDay() === 0 : false

  const monthSetlists = setlists
    .filter((s) => {
      const d = new Date(s.date)
      return d.getFullYear() === year && d.getMonth() === month
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const unavailableSundays = Array.from(unavailable).filter((k) => {
    const [y, m] = k.split('-').map(Number)
    if (y !== year || m !== month + 1) return false
    const day = parseInt(k.split('-')[2])
    return new Date(year, month, day).getDay() === 0
  }).length

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendário</h1>
          <p className="text-muted text-sm">Marque sua disponibilidade nos domingos</p>
        </div>
        {unavailableSundays > 0 && (
          <div className="text-right">
            <p className="text-error text-sm font-medium">{unavailableSundays} domingo{unavailableSundays > 1 ? 's' : ''} indisponível{unavailableSundays > 1 ? 'is' : ''}</p>
            <p className="text-muted text-xs">em {MONTHS[month]}</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Calendário */}
        <div className="lg:col-span-2 card">
          {/* Navegação */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-semibold text-white">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={clsx('text-center text-xs py-1 font-medium', i === 0 ? 'text-primary-light' : 'text-muted')}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid de dias */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const date = new Date(year, month, day)
              const isSun = date.getDay() === 0
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const key = toDateKey(year, month, day)
              const isUnavail = unavailable.has(key)
              const daySetlists = setlistsForDay(day)
              const hasSetlist = daySetlists.length > 0
              const isSelected = selectedDay === day
              const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={clsx(
                    'relative min-h-[48px] p-1 rounded-lg text-sm transition-all text-left',
                    isSelected && 'ring-2 ring-primary',
                    isToday && 'bg-primary text-white font-bold',
                    !isToday && isUnavail && isSun && 'bg-error/15 border border-error/30',
                    !isToday && hasSetlist && !isUnavail && 'bg-primary-ghost border border-primary/20',
                    !isToday && !isUnavail && !hasSetlist && isSun && 'bg-surface/60',
                    !isToday && !isSun && 'hover:bg-surface/40',
                    isSun && !isToday && 'hover:opacity-80 cursor-pointer',
                    isPast && !isToday && 'opacity-40',
                  )}
                >
                  <span className={clsx(
                    'block text-center text-xs leading-none mb-1',
                    isToday ? 'text-white' : isSun ? (isUnavail ? 'text-error' : 'text-primary-light') : 'text-white',
                  )}>
                    {day}
                  </span>
                  {hasSetlist && (
                    <div className="flex justify-center">
                      <div className={clsx('w-1 h-1 rounded-full', isToday ? 'bg-white' : 'bg-primary-light')} />
                    </div>
                  )}
                  {isUnavail && isSun && !isToday && (
                    <div className="flex justify-center mt-0.5">
                      <div className="w-1 h-1 rounded-full bg-error" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <div className="w-3 h-3 rounded bg-primary-ghost border border-primary/30" />
              Culto agendado
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <div className="w-3 h-3 rounded bg-error/15 border border-error/30" />
              Indisponível
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <div className="w-3 h-3 rounded bg-primary" />
              Hoje
            </div>
          </div>
        </div>

        {/* Painel lateral */}
        <div className="space-y-3">
          {/* Detalhe do dia selecionado */}
          {selectedDay ? (
            <div className="card space-y-3">
              <h3 className="font-semibold text-white text-sm">
                {WEEKDAYS[new Date(year, month, selectedDay).getDay()]}, {selectedDay} de {MONTHS[month]}
              </h3>

              {isSunday && (
                <button
                  onClick={() => toggleUnavailable(selectedDay)}
                  className={clsx(
                    'w-full py-2 rounded-lg text-sm font-medium transition-colors border',
                    selectedIsUnavailable
                      ? 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                      : 'bg-error/10 text-error border-error/30 hover:bg-error/20',
                  )}
                >
                  {selectedIsUnavailable ? '✓ Marcar como disponível' : 'Marcar como indisponível'}
                </button>
              )}

              {selectedSetlists.length > 0 ? (
                <div className="space-y-2">
                  {selectedSetlists.map((s) => (
                    <div key={s.id} className="bg-surface rounded-lg p-3">
                      <p className="font-medium text-white text-sm">{s.title}</p>
                      <p className="text-muted text-xs flex items-center gap-1 mt-1">
                        <Music size={10} /> {s.songs?.length ?? 0} músicas
                      </p>
                      <span className={clsx('badge border text-xs mt-2',
                        s.status === 'published' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'
                      )}>
                        {s.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-xs">Nenhum culto agendado neste dia.</p>
              )}

              {!isSunday && (
                <p className="text-muted text-xs flex items-center gap-1">
                  <Info size={12} /> Indisponibilidade só pode ser marcada nos domingos.
                </p>
              )}
            </div>
          ) : (
            <div className="card">
              <p className="text-muted text-sm">Clique em um dia para ver detalhes.</p>
              <p className="text-muted text-xs mt-2">Nos domingos, você pode marcar sua disponibilidade para a escala automática.</p>
            </div>
          )}

          {/* Cultos do mês */}
          {monthSetlists.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white text-sm mb-3">Cultos em {MONTHS[month]}</h3>
              <div className="space-y-2">
                {monthSetlists.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      const d = new Date(s.date)
                      if (d.getMonth() === month) setSelectedDay(d.getDate())
                    }}
                    className="flex items-center gap-2 p-2 bg-surface hover:bg-surface-alt rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="text-center shrink-0 w-8">
                      <p className="text-base font-bold text-primary-light leading-none">{new Date(s.date).getDate()}</p>
                      <p className="text-xs text-muted">{WEEKDAYS[new Date(s.date).getDay()]}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{s.title}</p>
                    </div>
                    <span className={clsx('w-2 h-2 rounded-full shrink-0',
                      s.status === 'published' ? 'bg-success' : 'bg-warning'
                    )} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
