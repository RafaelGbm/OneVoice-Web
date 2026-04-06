import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { ChevronLeft, ChevronRight, Music } from 'lucide-react'
import { clsx } from 'clsx'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function CalendarPage() {
  const { setlists, refreshSetlists } = useApp()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  useEffect(() => { refreshSetlists() }, [refreshSetlists])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  function setlistsForDay(day: number) {
    return setlists.filter((s) => {
      const d = new Date(s.date)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Preenche até completar a última semana
  while (cells.length % 7 !== 0) cells.push(null)

  const monthSetlists = setlists
    .filter((s) => {
      const d = new Date(s.date)
      return d.getFullYear() === year && d.getMonth() === month
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white">Calendário</h1>

      {/* Calendar header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-white">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs text-muted py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const daySetlists = setlistsForDay(day)
            return (
              <div
                key={i}
                className={clsx(
                  'min-h-[44px] p-1 rounded-lg text-sm transition-colors',
                  isToday ? 'bg-primary text-white font-bold' : 'hover:bg-surface',
                  daySetlists.length > 0 && !isToday && 'bg-primary-ghost border border-primary/20',
                )}
              >
                <span className={clsx('block text-center mb-0.5', !isToday && 'text-white')}>{day}</span>
                {daySetlists.map((s) => (
                  <div key={s.id} className="text-xs truncate text-primary-lighter px-0.5">{s.title}</div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Month events list */}
      {monthSetlists.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white mb-3">Eventos em {MONTHS[month]}</h3>
          <div className="space-y-2">
            {monthSetlists.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-2 bg-surface rounded-lg">
                <div className="text-center shrink-0 w-10">
                  <p className="text-lg font-bold text-primary-light leading-none">{new Date(s.date).getDate()}</p>
                  <p className="text-xs text-muted">{WEEKDAYS[new Date(s.date).getDay()]}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{s.title}</p>
                  <p className="text-muted text-xs flex items-center gap-1">
                    <Music size={10} /> {s.songs?.length ?? 0} músicas
                  </p>
                </div>
                <span className={clsx('badge border text-xs', s.status === 'published' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20')}>
                  {s.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
