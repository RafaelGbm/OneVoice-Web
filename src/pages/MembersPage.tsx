import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Users, Search, Mail, UserCheck, Shield, Crown } from 'lucide-react'
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

export function MembersPage() {
  const { members, refreshMembers } = useApp()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all')

  useEffect(() => { refreshMembers() }, [refreshMembers])

  const allRoles = Array.from(new Set(members.flatMap((m) => m.roles))) as UserRole[]

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || m.roles.includes(filterRole)
    return matchSearch && matchRole
  })

  // Ordena: owner → admin → resto
  const sorted = [...filtered].sort((a, b) => {
    const rank = (roles: UserRole[]) =>
      roles.includes('owner') ? 0 : roles.includes('admin') ? 1 : 2
    return rank(a.roles) - rank(b.roles)
  })

  const owners = members.filter((m) => m.roles.includes('owner'))
  const admins = members.filter((m) => m.roles.includes('admin') && !m.roles.includes('owner'))
  const regular = members.filter((m) => !m.roles.includes('owner') && !m.roles.includes('admin'))

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Membros</h1>
          <p className="text-muted text-sm">{members.length} membros ativos</p>
        </div>
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
            const isOwner = member.roles.includes('owner')
            const isAdmin = member.roles.includes('admin')
            return (
              <div key={member.id} className={clsx(
                'card flex items-center gap-3 transition-colors',
                isOwner && 'border-yellow-500/20',
                isAdmin && !isOwner && 'border-primary/20',
              )}>
                {/* Avatar */}
                <div className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border',
                  isOwner ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                    : isAdmin ? 'bg-primary-ghost text-primary-light border-primary/30'
                      : 'bg-surface text-muted border-border',
                )}>
                  {member.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white truncate">{member.name}</p>
                    {isOwner && <Crown size={12} className="text-yellow-400 shrink-0" />}
                  </div>
                  <p className="text-muted text-xs flex items-center gap-1 mt-0.5 truncate">
                    <Mail size={10} /> {member.email}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {member.roles.map((role) => <RoleBadge key={role} role={role} />)}
                  </div>
                </div>

                {/* Status */}
                <UserCheck size={16} className="text-success shrink-0" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
