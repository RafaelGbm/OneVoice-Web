import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { User, Shield, LogOut, ChevronRight, Crown, Check } from 'lucide-react'
import { clsx } from 'clsx'

const PLAN_INFO: Record<string, { label: string; color: string; limit: string }> = {
  free:   { label: 'Gratuito', color: 'text-muted',         limit: 'Funcionalidades básicas' },
  basic:  { label: 'Básico',   color: 'text-primary-light', limit: 'Até 15 membros' },
  pro:    { label: 'Pro',      color: 'text-yellow-400',    limit: 'Até 40 membros' },
  church: { label: 'Igreja',   color: 'text-orange-400',    limit: 'Até 50 membros' },
}

export function SettingsPage() {
  const { user, currentMinistry, subscription, signOut, ministries, setCurrentMinistry } = useApp()
  const [signingOut, setSigningOut] = useState(false)
  const [showMinistries, setShowMinistries] = useState(false)

  const plan = PLAN_INFO[subscription.planKey ?? 'free']

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
  }

  const userName = (user?.user_metadata?.name as string | undefined) ?? user?.email?.split('@')[0] ?? '—'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      {/* Conta */}
      <section className="card space-y-0 divide-y divide-border">
        <div className="flex items-center gap-3 pb-4">
          <div className="w-12 h-12 rounded-full bg-primary-ghost border border-primary/30 flex items-center justify-center text-primary-light font-bold text-lg shrink-0">
            {userName[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{userName}</p>
            <p className="text-muted text-sm">{user?.email}</p>
          </div>
        </div>

        <Row label="E-mail" value={user?.email ?? '—'} />
        <Row label="ID do usuário" value={user?.id ? user.id.slice(0, 8) + '...' : '—'} mono />
        <Row
          label="Autenticação"
          value={user?.app_metadata?.provider === 'email' ? 'Email e senha' : user?.app_metadata?.provider ?? 'Email'}
        />
      </section>

      {/* Ministério */}
      <section className="card space-y-0">
        <div className="flex items-center gap-2 mb-3">
          <User size={15} className="text-primary-light" />
          <h2 className="font-semibold text-white">Ministério</h2>
        </div>
        <div className="space-y-0 divide-y divide-border">
          <Row label="Nome" value={currentMinistry?.name ?? '—'} />
          {currentMinistry?.churchName && <Row label="Igreja" value={currentMinistry.churchName} />}

          {ministries.length > 1 && (
            <div className="py-3">
              <button
                onClick={() => setShowMinistries((v) => !v)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-sm text-muted">Trocar ministério</span>
                <ChevronRight size={14} className={clsx('text-muted transition-transform', showMinistries && 'rotate-90')} />
              </button>
              {showMinistries && (
                <div className="mt-2 space-y-1">
                  {ministries.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setCurrentMinistry(m); setShowMinistries(false) }}
                      className={clsx(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                        m.id === currentMinistry?.id
                          ? 'bg-primary-ghost text-primary-light'
                          : 'bg-surface text-muted hover:text-white hover:bg-surface-alt',
                      )}
                    >
                      {m.name}
                      {m.id === currentMinistry?.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Assinatura */}
      <section className="card space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-primary-light" />
          <h2 className="font-semibold text-white">Assinatura</h2>
        </div>

        <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
          <div>
            <div className="flex items-center gap-2">
              <Crown size={14} className={plan.color} />
              <span className={clsx('font-semibold', plan.color)}>{plan.label}</span>
            </div>
            <p className="text-muted text-xs mt-0.5">{plan.limit}</p>
          </div>
          <span className={clsx('badge border',
            subscription.isActive
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-surface text-muted border-border')}>
            {subscription.isActive ? 'Ativa' : 'Inativa'}
          </span>
        </div>

        {subscription.currentPeriodEnd && (
          <p className="text-muted text-xs">
            {subscription.isActive ? 'Renova em' : 'Expirou em'}{' '}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}
        {subscription.trialEnd && (
          <p className="text-warning text-xs">
            Trial encerra em {new Date(subscription.trialEnd).toLocaleDateString('pt-BR')}
          </p>
        )}
        <p className="text-muted text-xs">
          Para gerenciar planos e pagamentos, acesse o app mobile OneVoice.
        </p>
      </section>

      {/* Sair */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full card flex items-center gap-3 text-error hover:border-error/40 transition-colors disabled:opacity-60"
      >
        <LogOut size={16} />
        <span className="font-medium">{signingOut ? 'Saindo...' : 'Sair da conta'}</span>
      </button>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-muted text-sm">{label}</span>
      <span className={clsx('text-white text-sm', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  )
}
