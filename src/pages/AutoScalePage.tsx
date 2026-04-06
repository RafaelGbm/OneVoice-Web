/**
 * Auto Escala (Admin) — geração automática de escala balanceada
 * Portado do AutoScaleAdminScreen do app mobile
 */
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import {
  getMemberProfileMap, getMemberUnavailabilityMap, saveMemberUnavailabilityMap,
  getRecentSchedules, buildMemberFrequencyMap, buildConsecutiveStreakMap,
  generateBalancedSchedule, publishSchedule,
  getNextSunday, toDateKey,
  type GeneratedSchedule, type PublishedSchedule, type MemberProfile,
} from '@/lib/autoSchedule'
import {
  Lock, Sparkles, ChevronLeft, ChevronRight, CloudUpload,
  CheckCircle, AlertTriangle, Info,
} from 'lucide-react'
import { clsx } from 'clsx'

const ROLE_LABELS: Record<string, string> = {
  guitarist: 'Guitarra', keyboardist: 'Teclado', vocalist: 'Vocal',
  drummer: 'Bateria', bassist: 'Baixo', acoustic_guitarist: 'Violão',
  minister: 'Ministro', admin: 'Admin', owner: 'Owner',
}

function plusDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function AutoScalePage() {
  const { members, user, currentMinistry, isAdmin, isOwner, transferOwnership } = useApp()

  const [targetDate, setTargetDate] = useState<Date>(getNextSunday())
  const [profileMap, setProfileMap] = useState<Record<string, MemberProfile>>({})
  const [unavailabilityMap, setUnavailabilityMap] = useState<Record<string, string[]>>({})
  const [generated, setGenerated] = useState<GeneratedSchedule | null>(null)
  const [recentSchedules, setRecentSchedules] = useState<PublishedSchedule[]>([])
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const activeMembers = useMemo(() => members.filter((m) => m.isActive), [members])
  const dateKey = toDateKey(targetDate)

  const frequencyMap = useMemo(() => buildMemberFrequencyMap(recentSchedules), [recentSchedules])
  const consecutiveStreakMap = useMemo(() => buildConsecutiveStreakMap(recentSchedules), [recentSchedules])
  const publishedDateKeys = useMemo(() => new Set(recentSchedules.map((s) => s.dateKey)), [recentSchedules])

  useEffect(() => {
    setProfileMap(getMemberProfileMap())
    setUnavailabilityMap(getMemberUnavailabilityMap())
  }, [])

  useEffect(() => {
    if (!currentMinistry) return
    getRecentSchedules(currentMinistry.id).then(setRecentSchedules).catch(() => {})
  }, [currentMinistry])

  function toggleUnavailable(email: string) {
    const key = email.toLowerCase()
    const current = new Set(unavailabilityMap[key] || [])
    if (current.has(dateKey)) current.delete(dateKey)
    else current.add(dateKey)
    const next = { ...unavailabilityMap, [key]: [...current] }
    setUnavailabilityMap(next)
    saveMemberUnavailabilityMap(next)
  }

  function handleGenerate() {
    setPublishMsg(null)
    const result = generateBalancedSchedule({
      members: activeMembers,
      unavailableMap: unavailabilityMap,
      profileMap,
      targetDate,
      frequencyMap,
      consecutiveStreakMap,
    })
    setGenerated(result)
  }

  async function handlePublish() {
    if (!generated || !currentMinistry || !user) return
    setPublishing(true)
    setPublishMsg(null)
    try {
      await publishSchedule(generated, currentMinistry.id, user.id)
      const updated = await getRecentSchedules(currentMinistry.id)
      setRecentSchedules(updated)
      setPublishMsg({ type: 'success', text: 'Escala publicada com sucesso!' })
    } catch (err) {
      setPublishMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao publicar' })
    } finally {
      setPublishing(false)
    }
  }

  async function handleTransferOwnership(memberId: string, memberName: string) {
    if (!confirm(`Transferir liderança para ${memberName}?`)) return
    try {
      await transferOwnership(memberId)
      alert(`${memberName} agora é owner do ministério.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao transferir liderança')
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <Lock size={40} className="text-border" />
        <h2 className="text-xl font-bold text-white">Acesso restrito</h2>
        <p className="text-muted max-w-sm">Esta página é exclusiva para administradores do ministério.</p>
      </div>
    )
  }

  const myMember = activeMembers.find((m) => m.userId === user?.id)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Auto Escala</h1>
        <p className="text-muted text-sm">Geração automática e balanceada de escalas</p>
      </div>

      {/* Data alvo */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-white">Data alvo</h2>
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setTargetDate((d) => plusDays(d, -7))}
            className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="font-bold text-white">
            {targetDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => setTargetDate((d) => plusDays(d, 7))}
            className="p-2 rounded-lg bg-surface border border-border text-muted hover:text-white transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
        <p className="text-muted text-xs">Configure disponibilidade abaixo e clique em Gerar.</p>
        <button onClick={handleGenerate}
          className="btn-primary flex items-center gap-2 w-full justify-center">
          <Sparkles size={16} /> Gerar Escala Automática
        </button>
      </div>

      {/* Disponibilidade */}
      <div className="card space-y-1">
        <h2 className="font-semibold text-white mb-3">Disponibilidade por membro</h2>
        {activeMembers.length === 0 ? (
          <p className="text-muted text-sm">Nenhum membro ativo.</p>
        ) : activeMembers.map((member) => {
          const unavailable = (unavailabilityMap[member.email.toLowerCase()] || []).includes(dateKey)
          return (
            <div key={member.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{member.name}</p>
                <p className="text-xs text-muted">{member.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}</p>
              </div>
              <button
                onClick={() => toggleUnavailable(member.email)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                  unavailable
                    ? 'bg-error/10 text-error border-error/30 hover:bg-error/20'
                    : 'bg-success/10 text-success border-success/30 hover:bg-success/20',
                )}
              >
                {unavailable ? 'Indisponível' : 'Disponível'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Resultado gerado */}
      {generated && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Resultado da Escala</h2>
            {publishedDateKeys.has(generated.dateKey) && (
              <span className="flex items-center gap-1 text-xs text-success font-semibold">
                <CheckCircle size={12} /> Publicada
              </span>
            )}
          </div>
          <p className="text-muted text-sm capitalize">{generated.dateLabel}</p>

          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Base instrumental</p>
            <div className="space-y-1">
              {generated.base.map((item) => (
                <div key={item.slot} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted">{item.slot}</span>
                  <span className={clsx('text-sm font-semibold', item.member ? 'text-white' : 'text-error')}>
                    {item.member?.name ?? '— Não preenchido'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Vocais</p>
            <div className="space-y-1">
              {generated.vocals.map((item) => (
                <div key={item.slot} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted">{item.slot}</span>
                  <span className={clsx('text-sm font-semibold', item.member ? 'text-white' : 'text-error')}>
                    {item.member?.name ?? '— Não preenchido'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {generated.missing.length > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <p className="text-warning text-xs font-bold mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} /> Pendências
              </p>
              {generated.missing.map((m) => (
                <p key={m} className="text-warning/80 text-xs">• Falta: {m}</p>
              ))}
            </div>
          )}

          {generated.notes.length > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-primary-light text-xs font-bold mb-2 flex items-center gap-1.5">
                <Info size={12} /> Notas de equilíbrio
              </p>
              {generated.notes.map((n, idx) => (
                <p key={idx} className="text-primary-light/80 text-xs">• {n}</p>
              ))}
            </div>
          )}

          {publishMsg && (
            <div className={clsx(
              'rounded-lg px-3 py-2 text-sm font-medium',
              publishMsg.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20',
            )}>
              {publishMsg.text}
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 w-full justify-center px-4 py-3 rounded-xl bg-success text-white font-bold text-sm hover:bg-success/90 disabled:opacity-60 transition-colors"
          >
            <CloudUpload size={16} />
            {publishing
              ? 'Publicando...'
              : publishedDateKeys.has(generated.dateKey)
              ? 'Atualizar Escala'
              : 'Publicar Escala'}
          </button>
        </div>
      )}

      {/* Transferência de liderança (apenas owner) */}
      {isOwner && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Transferir liderança</h2>
          <p className="text-muted text-xs">
            Transfira a liderança antes de sair para manter ao menos um owner ativo.
          </p>
          {activeMembers
            .filter((m) => m.id !== myMember?.id)
            .map((member) => {
              const alreadyOwner = member.roles.includes('owner')
              return (
                <div key={member.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{member.name}</p>
                    <p className="text-xs text-muted">{alreadyOwner ? 'Já é owner' : 'Membro elegível'}</p>
                  </div>
                  {!alreadyOwner && (
                    <button
                      onClick={() => handleTransferOwnership(member.id, member.name)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-primary/10 text-primary-light border-primary/30 hover:bg-primary/20 transition-colors"
                    >
                      Tornar owner
                    </button>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
