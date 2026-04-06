import { useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { ClipboardList, Users, Calendar } from 'lucide-react'
import { ROLE_LABELS } from '@/types'

export function EscalaPage() {
  const { setlists, members, refreshSetlists, refreshMembers } = useApp()

  useEffect(() => {
    refreshSetlists()
    refreshMembers()
  }, [refreshSetlists, refreshMembers])

  const upcoming = setlists
    .filter((s) => s.status !== 'archived' && new Date(s.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Escala</h1>
        <p className="text-muted text-sm">Gerencie a escala de membros por culto</p>
      </div>

      {/* Equipe disponível */}
      <div className="card">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Users size={16} className="text-primary-light" />
          Equipe ({members.length} membros)
        </h2>
        {members.length === 0 ? (
          <p className="text-muted text-sm">Nenhum membro cadastrado</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-primary-ghost border border-primary/20 flex items-center justify-center text-xs text-primary-light font-bold">
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-white leading-none">{m.name}</p>
                  <p className="text-xs text-muted">{m.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Próximos cultos */}
      <div className="card">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-primary-light" />
          Próximos cultos
        </h2>
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-muted">
            <ClipboardList size={36} className="text-border" />
            <p className="text-sm">Nenhum culto agendado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((setlist) => (
              <div key={setlist.id} className="bg-surface rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{setlist.title}</p>
                    <p className="text-muted text-sm mt-0.5">
                      {new Date(setlist.date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                  <span className={`badge border text-xs ${setlist.status === 'published' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                    {setlist.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <p className="text-xs text-muted mt-2">
                  A escala automática está disponível no app mobile.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card bg-primary-ghost border-primary/20">
        <div className="flex items-start gap-3">
          <ClipboardList size={20} className="text-primary-light shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-white">Escala automática</p>
            <p className="text-muted text-sm mt-1">
              A geração automática de escala por inteligência artificial está disponível no app mobile OneVoice. A versão web permite visualizar e gerenciar as escalas geradas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
