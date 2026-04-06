import { useApp } from '@/context/AppContext'
import { User, Shield, LogOut } from 'lucide-react'

export function SettingsPage() {
  const { user, currentMinistry, subscription, signOut } = useApp()

  const planLabel = {
    free: 'Gratuito',
    basic: 'Básico',
    pro: 'Pro',
    null: 'Sem plano',
  }[subscription.planKey ?? 'null'] ?? 'Sem plano'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
      </div>

      {/* Account */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <User size={16} className="text-primary-light" />
          Conta
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted text-sm">E-mail</span>
            <span className="text-white text-sm">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted text-sm">Ministério</span>
            <span className="text-white text-sm">{currentMinistry?.name ?? '—'}</span>
          </div>
          {currentMinistry?.churchName && (
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted text-sm">Igreja</span>
              <span className="text-white text-sm">{currentMinistry.churchName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Subscription */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Shield size={16} className="text-primary-light" />
          Assinatura
        </h2>
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-muted text-sm">Plano atual</span>
          <span className={`badge ${subscription.isActive ? 'bg-success/10 text-success border border-success/20' : 'bg-surface text-muted border border-border'}`}>
            {planLabel}
          </span>
        </div>
        {subscription.currentPeriodEnd && (
          <div className="flex items-center justify-between py-2">
            <span className="text-muted text-sm">Válido até</span>
            <span className="text-white text-sm">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
        <p className="text-muted text-xs">
          Para gerenciar assinaturas, planos e pagamentos, acesse o app mobile OneVoice.
        </p>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full card flex items-center gap-3 text-error hover:border-error/40 transition-colors"
      >
        <LogOut size={16} />
        <span className="font-medium">Sair da conta</span>
      </button>
    </div>
  )
}
