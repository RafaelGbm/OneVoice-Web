/**
 * Tradução de erros do Supabase Auth para pt-BR
 * Espelha o padrão do app mobile
 */
export function translateAuthError(message: string): string {
  const msg = message.toLowerCase()

  if (msg.includes('user already registered') || msg.includes('email already exists') || msg.includes('already been registered'))
    return 'Este email já está cadastrado. Tente fazer login.'
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials'))
    return 'Email ou senha incorretos. Verifique seus dados.'
  if (msg.includes('email not confirmed'))
    return 'Email não confirmado. Verifique sua caixa de entrada.'
  if (msg.includes('password should be at least'))
    return 'A senha deve ter pelo menos 8 caracteres.'
  if (msg.includes('rate limit') || msg.includes('too many requests'))
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Erro de conexão. Verifique sua internet.'
  if (msg.includes('user not found'))
    return 'Usuário não encontrado.'
  if (msg.includes('token expired') || msg.includes('refresh token'))
    return 'Sessão expirada. Faça login novamente.'
  if (msg.includes('weak password'))
    return 'Senha muito fraca. Use pelo menos 8 caracteres com letras e números.'
  if (msg.includes('signup disabled'))
    return 'Cadastro temporariamente desativado.'

  return message
}
