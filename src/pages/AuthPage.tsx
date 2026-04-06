import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Music, Eye, EyeOff } from 'lucide-react'

type Mode = 'login' | 'signup' | 'forgot'

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (error) throw error
        setMessage('Verifique seu e-mail para confirmar o cadastro.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
        setMessage('Enviamos um link de redefinição para seu e-mail.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-primary/30">
            <Music size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">OneVoice</h1>
            <p className="text-muted text-sm mt-1">Gestão de ministérios de louvor</p>
          </div>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">
            {mode === 'login' && 'Entrar'}
            {mode === 'signup' && 'Criar conta'}
            {mode === 'forgot' && 'Recuperar senha'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-muted mb-1">Nome</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-muted mb-1">E-mail</label>
              <input
                className="input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm text-muted mb-1">Senha</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-error text-sm bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-success text-sm bg-success/10 border border-success/20 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
            </button>
          </form>

          {/* Mode switcher */}
          <div className="mt-4 flex flex-col items-center gap-2 text-sm">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('forgot')} className="text-muted hover:text-white transition-colors">
                  Esqueci minha senha
                </button>
                <span className="text-muted">
                  Não tem conta?{' '}
                  <button onClick={() => setMode('signup')} className="text-primary-light hover:underline">
                    Criar conta
                  </button>
                </span>
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => setMode('login')} className="text-primary-light hover:underline">
                Voltar para o login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
