import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import {
  Users, Search, Mail, UserCheck, Shield, Crown,
  UserPlus, ShieldCheck, UserX, Copy, Check, X,
} from 'lucide-react'
import { ROLE_LABELS, type UserRole } from '@/types'
import { clsx } from 'clsx'

const ROLE_ICONS: Partial<Record<UserRole, typeof Shield>> = {
  owner: Crown,
  admin: Shield,
}

function RoleBadge({ role }: { role: UserRole }) {
  const Icon = ROLE_ICONS[role]
  const isPrimary = role === 'owner' || role === 'admin'
  return (
    <span className={clsx(
      'badge border text-xs',
      role === 'owner' && 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      role === 'admin' && 'bg-primary/10 text-primary-light border-primary/20',
      !isPrimary && 'bg-surface text-muted border-border',
    )}>
      {Icon && <Icon size={9} />}
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

// ── Modal de convite ──────────────────────────────────────────
function InviteModal({ onClose }: { onClose: () => void }) {
  const { createInvite } = useApp()
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [expires, setExpires] = useState(1440) // 24h em minutos
  const [generating, setGenerating] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const { token } = await createInvite(role, expires)
      const link = `${window.location.origin}/join/${token}`
      setInviteLink(link)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar convite')
    } finally {
      setGenerating(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-white">Convidar membro</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Papel do convidado</label>
            <select
              className="input w-full"
              value={role}
              onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
            >
              <option value="member">Membro</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Validade do link</label>
            <select
              className="input w-full"
              value={expires}
              onChange={(e) => setExpires(Number(e.target.value))}
            >
              <option value={60}>1 hora</option>
              <option value={1440}>24 horas</option>
              <option value={10080}>7 dias</option>
            </select>
          </div>

          {!inviteLink ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary w-full flex items-center gap-2 justify-center"
            >
              <UserPlus size={15} />
              {generating ? 'Gerando...' : 'Gerar link de convite'}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted">Link gerado — compartilhe com o novo membro:</p>
              <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                <p className="flex-1 text-xs text-white/80 truncate font-mono">{inviteLink}</p>
                <button onClick={copyLink} className={clsx('shrink-0 transition-colors', copied ? 'text-success' : 'text-muted hover:text-white')}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-xs text-muted">
                O link é usado via app mobile. Validade conforme selecionado.
              </p>
            </div>
          )}

          {error && <p className="text-error text-sm">{error}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export function MembersPage() {
  const { members, refreshMembers, isAdmin, isOwner, promoteMemberToAdmin, removeMember, user } = useApp()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all')
  const [showInvite, setShowInvite] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { refreshMembers() }, [refreshMembers])

  const allRoles = Array.from(new Set(members.flatMap((m) => m.roles))) as UserRole[]

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || m.roles.includes(filterRole)
    return matchSearch && matchRole
  })

  const sorted = [...filtered].sort((a, b) => {
    const rank = (roles: UserRole[]) =>
      roles.includes('owner') ? 0 : roles.includes('admin') ? 1 : 2
    return rank(a.roles) - rank(b.roles)
  })

  const owners = members.filter((m) => m.roles.includes('owner'))
  const admins = members.filter((m) => m.roles.includes('admin') && !m.roles.includes('owner'))
  const regular = members.filter((m) => !m.roles.includes('owner') && !m.roles.includes('admin'))

  async function handlePromote(memberId: string, memberName: string) {
    if (!confirm(`Promover ${memberName} a administrador?`)) return
    setActionLoading(memberId)
    try {
      await promoteMemberToAdmin(memberId)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao promover')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRemove(memberId: string, memberName: string) {
    if (!confirm(`Remover ${memberName} do ministério?`)) return
    setActionLoading(memberId)
    try {
      await removeMember(memberId)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover membro')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Membros</h1>
          <p className="text-muted text-sm">{members.length} membros ativos</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <UserPlus size={15} /> Convidar
          </button>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Líderes', value: owners.length, icon: Crown, color: 'text-yellow-400' },
          { label: 'Admins', value: admins.length, icon: Shield, color: 'text-primary-light' },
          { label: 'Membros', value: regular.length, icon: Users, color: 'text-muted' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <Icon size={18} className={clsx(color, 'mx-auto mb-1')} />
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-muted text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9 py-2" placeholder="Buscar membro..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto py-2" value={filterRole} onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}>
          <option value="all">Todos os papéis</option>
          {allRoles.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <Users size={40} className="text-border" />
          <p>{search || filterRole !== 'all' ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((member) => {
            const memberIsOwner = member.roles.includes('owner')
            const memberIsAdmin = member.roles.includes('admin')
            const isSelf = member.userId === user?.id
            const isLoading = actionLoading === member.id

            return (
              <div key={member.id} className={clsx(
                'card flex items-center gap-3 transition-colors',
                memberIsOwner && 'border-yellow-500/20',
                memberIsAdmin && !memberIsOwner && 'border-primary/20',
              )}>
                {/* Avatar */}
                <div className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border',
                  memberIsOwner ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                    : memberIsAdmin ? 'bg-primary-ghost text-primary-light border-primary/30'
                      : 'bg-surface text-muted border-border',
                )}>
                  {member.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white truncate">{member.name}</p>
                    {isSelf && <span className="text-xs text-muted">(você)</span>}
                    {memberIsOwner && <Crown size={12} className="text-yellow-400 shrink-0" />}
                  </div>
                  <p className="text-muted text-xs flex items-center gap-1 mt-0.5 truncate">
                    <Mail size={10} /> {member.email}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {member.roles.map((role) => <RoleBadge key={role} role={role} />)}
                  </div>
                </div>

                {/* Ações admin */}
                {isAdmin && !isSelf && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Promover a admin (apenas owner pode, e apenas se não for admin) */}
                    {isOwner && !memberIsAdmin && (
                      <button
                        onClick={() => handlePromote(member.id, member.name)}
                        disabled={isLoading}
                        title="Promover a admin"
                        className="p-1.5 text-muted hover:text-primary-light rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-40"
                      >
                        <ShieldCheck size={15} />
                      </button>
                    )}
                    {/* Remover membro (owner pode remover qualquer um; admin só membros) */}
                    {(isOwner || (!memberIsAdmin && !memberIsOwner)) && (
                      <button
                        onClick={() => handleRemove(member.id, member.name)}
                        disabled={isLoading}
                        title="Remover do ministério"
                        className="p-1.5 text-muted hover:text-error rounded-lg hover:bg-error/10 transition-colors disabled:opacity-40"
                      >
                        <UserX size={15} />
                      </button>
                    )}
                  </div>
                )}

                {!isAdmin && <UserCheck size={16} className="text-success shrink-0" />}
              </div>
            )
          })}
        </div>
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  )
}
