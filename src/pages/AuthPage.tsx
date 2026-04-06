import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { translateAuthError } from '@/lib/errors'
import { Eye, EyeOff, Music2, CalendarDays, Users, ListMusic } from 'lucide-react'

type Mode = 'login' | 'signup' | 'forgot'

const features = [
  { icon: ListMusic, label: 'Setlists e músicas organizadas por culto' },
  { icon: Users, label: 'Escala automática de membros' },
  { icon: CalendarDays, label: 'Calendário de eventos do ministério' },
  { icon: Music2, label: 'Biblioteca de cifras e letras com transposição' },
]

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function validate(): string {
    if (mode === 'signup') {
      if (!name.trim()) return 'Informe seu nome.'
      if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
      if (password !== confirmPassword) return 'As senhas não coincidem.'
    }
    if (mode === 'login' && !password) return 'Informe sua senha.'
    return ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() } },
        })
        if (error) throw error
        setMessage('Verifique seu e-mail para confirmar o cadastro.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        })
        if (error) throw error
        setMessage('Enviamos um link de redefinição para seu e-mail.')
      }
    } catch (err) {
      setError(translateAuthError(err instanceof Error ? err.message : 'Ocorreu um erro'))
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* ── Lado esquerdo — branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-card border-r border-border p-12">
        <div className="flex items-center gap-3">
          <img src="/onevoice-icon.png" alt="OneVoice" className="w-10 h-10 rounded-xl object-cover" />
          <span className="text-xl font-bold text-white">OneVoice</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Gerencie seu ministério{' '}
              <span className="text-primary-light">com simplicidade</span>
            </h1>
            <p className="text-muted mt-4 text-lg leading-relaxed">
              Tudo que sua equipe de louvor precisa em um só lugar — na palma da mão ou no computador.
            </p>
          </div>

          <ul className="space-y-4">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-ghost border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-primary-light" />
                </div>
                <span className="text-white/80 text-sm">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-subtle text-sm">© {new Date().getFullYear()} OneVoice</p>
      </div>

      {/* ── Lado direito — formulário ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex flex-col items-center gap-3 mb-8 lg:hidden">
            <img src="/onevoice-icon.png" alt="OneVoice" className="w-14 h-14 rounded-2xl object-cover" />
            <h1 className="text-xl font-bold text-white">OneVoice</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {mode === 'login' && 'Entrar na conta'}
              {mode === 'signup' && 'Criar conta'}
              {mode === 'forgot' && 'Recuperar senha'}
            </h2>
            <p className="text-muted text-sm mt-1">
              {mode === 'login' && 'Bem-vindo de volta!'}
              {mode === 'signup' && 'Comece agora, é gratuito.'}
              {mode === 'forgot' && 'Enviaremos um link para seu e-mail.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-muted mb-1.5">Nome completo</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-muted mb-1.5">E-mail</label>
              <input
                className="input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus={mode !== 'signup'}
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm text-muted mb-1.5">
                  Senha
                  {mode === 'signup' && <span className="text-xs text-muted ml-1">(mínimo 8 caracteres)</span>}
                </label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === 'signup' ? 8 : 1}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-muted mb-1.5">Confirmar senha</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-error text-sm bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {message && (
              <div className="text-success text-sm bg-success/10 border border-success/20 rounded-lg px-3 py-2">
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
            </button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-2 text-sm">
            {mode === 'login' && (
              <>
                <button onClick={() => switchMode('forgot')} className="text-muted hover:text-white transition-colors">
                  Esqueci minha senha
                </button>
                <span className="text-muted">
                  Não tem conta?{' '}
                  <button onClick={() => switchMode('signup')} className="text-primary-light hover:underline">
                    Criar conta
                  </button>
                </span>
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => switchMode('login')} className="text-primary-light hover:underline">
                Voltar para o login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
