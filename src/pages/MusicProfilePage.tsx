/**
 * Perfil Musical — configuração de instrumentos, naipes e serviços
 * Portado do MusicProfileScreen do app mobile
 */
import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import {
  getMemberProfileMap, upsertMemberProfile, inferGenderFromNaipe,
  type VocalNaipe,
} from '@/lib/autoSchedule'
import { Save, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'

const INSTRUMENTS = [
  { id: 'guitarra', label: 'Guitarra' },
  { id: 'violao', label: 'Violão' },
  { id: 'baixo', label: 'Baixo' },
  { id: 'bateria', label: 'Bateria' },
  { id: 'teclado', label: 'Teclado' },
]

const VOCAL_NAIPES = [
  { id: 'soprano', label: 'Soprano' },
  { id: 'contralto', label: 'Contralto' },
  { id: 'tenor', label: 'Tenor' },
  { id: 'baixo_vocal', label: 'Baixo (Voz)' },
]

const OTHER_SERVICES = [
  { id: 'sonoplastia', label: 'Sonoplastia' },
  { id: 'midia', label: 'Mídia' },
]

function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors',
        active
          ? 'bg-primary/15 text-primary-light border-primary/40'
          : 'bg-bg text-muted border-border hover:text-white hover:border-border/80',
      )}
    >
      {active && <CheckCircle size={12} className="text-primary-light" />}
      {label}
    </button>
  )
}

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{children}</p>
  )
}

export function MusicProfilePage() {
  const { user } = useApp()

  const [instruments, setInstruments] = useState<string[]>([])
  const [otherInstrument, setOtherInstrument] = useState('')
  const [showOther, setShowOther] = useState(false)
  const [vocals, setVocals] = useState<string[]>([])
  const [primaryNaipe, setPrimaryNaipe] = useState<VocalNaipe>('none')
  const [services, setServices] = useState<string[]>([])
  const [primaryService, setPrimaryService] = useState('')
  const [canSingWhilePlaying, setCanSingWhilePlaying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.email) return
    const map = getMemberProfileMap()
    const profile = map[user.email.trim().toLowerCase()]
    if (!profile) return

    const otherInst = profile.instruments.find((i) => i.startsWith('outro:'))
    setInstruments(profile.instruments.filter((i) => !i.startsWith('outro:')))
    if (otherInst) { setOtherInstrument(otherInst.slice(6)); setShowOther(true) }
    setVocals(profile.vocals ?? [])
    setPrimaryNaipe(profile.primaryNaipe ?? 'none')
    setServices(profile.services ?? [])
    setPrimaryService(profile.primaryService ?? '')
    setCanSingWhilePlaying(profile.canSingWhilePlaying ?? false)
  }, [user?.email])

  // Reset naipe principal se foi desmarcado
  useEffect(() => {
    if (primaryNaipe !== 'none' && !vocals.includes(primaryNaipe)) setPrimaryNaipe('none')
  }, [vocals, primaryNaipe])

  function toggle(_list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, id: string) {
    setSaved(false)
    setList((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  async function handleSave() {
    if (!user?.email) return
    setSaving(true)
    setError('')
    try {
      const finalInstruments = showOther && otherInstrument.trim()
        ? [...instruments, `outro:${otherInstrument.trim()}`]
        : instruments
      upsertMemberProfile(user.email, {
        instruments: finalInstruments,
        vocals,
        services,
        gender: inferGenderFromNaipe(primaryNaipe, vocals),
        primaryNaipe,
        primaryService: primaryService || undefined,
        canSingWhilePlaying: canSingWhilePlaying || undefined,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // Todas as funções selecionadas para "serviço principal"
  const allSelected = [
    ...instruments.map((id) => ({ id, label: INSTRUMENTS.find((i) => i.id === id)?.label ?? id })),
    ...vocals.map((id) => ({ id, label: VOCAL_NAIPES.find((v) => v.id === id)?.label ?? id })),
    ...services.map((id) => ({ id, label: OTHER_SERVICES.find((s) => s.id === id)?.label ?? id })),
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Perfil Musical</h1>
        <p className="text-muted text-sm">
          Configure seus instrumentos, naipes e serviços para a escala automática.
        </p>
      </div>

      <div className="card space-y-6">
        {/* Instrumentos */}
        <div>
          <GroupLabel>Instrumental</GroupLabel>
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS.map((inst) => (
              <Chip
                key={inst.id}
                label={inst.label}
                active={instruments.includes(inst.id)}
                onClick={() => toggle(instruments, setInstruments, inst.id)}
              />
            ))}
            <Chip
              label="Outro"
              active={showOther}
              onClick={() => { setShowOther((v) => !v); setSaved(false) }}
            />
          </div>
          {showOther && (
            <input
              className="input mt-2 w-full"
              placeholder="Qual instrumento?"
              value={otherInstrument}
              onChange={(e) => { setOtherInstrument(e.target.value); setSaved(false) }}
              maxLength={40}
            />
          )}
        </div>

        <div className="border-t border-border" />

        {/* Vocais */}
        <div>
          <GroupLabel>Vocal (Naipe)</GroupLabel>
          <div className="flex flex-wrap gap-2">
            {VOCAL_NAIPES.map((naipe) => (
              <Chip
                key={naipe.id}
                label={naipe.label}
                active={vocals.includes(naipe.id)}
                onClick={() => toggle(vocals, setVocals, naipe.id)}
              />
            ))}
          </div>
        </div>

        {/* Naipe principal (se tiver múltiplos) */}
        {vocals.length > 1 && (
          <>
            <div className="border-t border-border" />
            <div>
              <GroupLabel>Naipe Principal</GroupLabel>
              <p className="text-muted text-xs mb-2">Qual naipe você prefere cantar?</p>
              <div className="flex flex-wrap gap-2">
                {vocals.map((id) => {
                  const naipe = VOCAL_NAIPES.find((v) => v.id === id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setPrimaryNaipe((prev) => prev === id ? 'none' : id as VocalNaipe); setSaved(false) }}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors',
                        primaryNaipe === id
                          ? 'bg-primary/15 text-primary-light border-primary/40'
                          : 'bg-bg text-muted border-border hover:text-white',
                      )}
                    >
                      {primaryNaipe === id && '★ '}
                      {naipe?.label ?? id}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <div className="border-t border-border" />

        {/* Outros serviços */}
        <div>
          <GroupLabel>Outros Serviços</GroupLabel>
          <div className="flex flex-wrap gap-2">
            {OTHER_SERVICES.map((svc) => (
              <Chip
                key={svc.id}
                label={svc.label}
                active={services.includes(svc.id)}
                onClick={() => toggle(services, setServices, svc.id)}
              />
            ))}
          </div>
        </div>

        {/* Serviço principal */}
        {allSelected.length > 1 && (
          <>
            <div className="border-t border-border" />
            <div>
              <GroupLabel>Serviço Principal</GroupLabel>
              <p className="text-muted text-xs mb-2">Em qual função você prefere ser escalado primeiro?</p>
              <div className="flex flex-wrap gap-2">
                {allSelected.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setPrimaryService((prev) => prev === item.id ? '' : item.id); setSaved(false) }}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors',
                      primaryService === item.id
                        ? 'bg-primary/15 text-primary-light border-primary/40'
                        : 'bg-bg text-muted border-border hover:text-white',
                    )}
                  >
                    {primaryService === item.id && '★ '}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Cantar enquanto toca */}
        {instruments.length > 0 && vocals.length > 0 && (
          <>
            <div className="border-t border-border" />
            <button
              type="button"
              onClick={() => { setCanSingWhilePlaying((v) => !v); setSaved(false) }}
              className={clsx(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left',
                canSingWhilePlaying ? 'bg-primary/10 border-primary/30' : 'bg-bg border-border hover:border-border/80',
              )}
            >
              <div className={clsx(
                'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors',
                canSingWhilePlaying ? 'bg-primary border-primary' : 'border-border',
              )}>
                {canSingWhilePlaying && <CheckCircle size={12} className="text-white" />}
              </div>
              <div>
                <p className={clsx('text-sm font-semibold', canSingWhilePlaying ? 'text-primary-light' : 'text-muted')}>
                  Posso cantar enquanto toco
                </p>
                <p className="text-xs text-muted mt-0.5">
                  A IA pode me escalar em instrumento e vocal ao mesmo tempo
                </p>
              </div>
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-error text-sm bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className={clsx(
          'flex items-center gap-2 w-full justify-center px-4 py-3 rounded-xl font-bold text-sm transition-colors',
          saved
            ? 'bg-success text-white hover:bg-success/90'
            : 'btn-primary',
          saving && 'opacity-60 cursor-not-allowed',
        )}
      >
        {saving ? (
          <span>Salvando...</span>
        ) : saved ? (
          <><CheckCircle size={16} /> Salvo!</>
        ) : (
          <><Save size={16} /> Salvar perfil musical</>
        )}
      </button>
    </div>
  )
}
