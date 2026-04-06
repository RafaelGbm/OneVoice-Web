import { useApp } from '@/context/AppContext'
import { Crown, Music, Smartphone, LogOut, List, Users, CalendarDays, Zap } from 'lucide-react'

const BENEFITS = [
  { icon: List, label: 'Gerencie setlists no computador' },
  { icon: Music, label: 'Biblioteca de músicas com transposição' },
  { icon: Users, label: 'Visualize escalas e membros' },
  { icon: CalendarDays, label: 'Calendário e disponibilidade da equipe' },
  { icon: Zap, label: 'Tudo sincronizado com o app mobile' },
]

export function SubscriptionRequiredPage() {
  const { signOut, user } = useApp()

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/onevoice-icon.png" alt="OneVoice" className="w-16 h-16 rounded-2xl object-cover" />
          <h1 className="text-2xl font-bold text-white">OneVoice Web</h1>
        </div>

        {/* Card principal */}
        <div className="card text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-ghost border border-primary/30 flex items-center justify-center">
              <Crown size={32} className="text-primary-light" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Acesso exclusivo para assinantes</h2>
            <p className="text-muted text-sm mt-2 leading-relaxed">
              O OneVoice Web é um benefício exclusivo para quem tem uma assinatura ativa no app mobile.
              Assine pelo app e volte aqui para ter acesso completo.
            </p>
          </div>

          {/* Benefícios */}
          <ul className="space-y-2.5 text-left">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary-ghost border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-primary-light" />
                </div>
                <span className="text-white/80 text-sm">{label}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 justify-center bg-surface rounded-xl px-4 py-3 border border-border">
              <Smartphone size={18} className="text-primary-light shrink-0" />
              <p className="text-sm text-white/80">
                Baixe o <span className="text-white font-semibold">OneVoice</span> e assine para ativar o acesso web
              </p>
            </div>

            <p className="text-muted text-xs">
              Logado como <span className="text-white">{user?.email}</span>
            </p>

            <button
              onClick={signOut}
              className="flex items-center gap-2 text-muted hover:text-white text-sm transition-colors mx-auto"
            >
              <LogOut size={14} /> Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
