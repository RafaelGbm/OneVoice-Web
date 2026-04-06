import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Users, Search, UserCheck, UserX } from 'lucide-react'
import { ROLE_LABELS } from '@/types'

export function MembersPage() {
  const { members, refreshMembers } = useApp()
  const [search, setSearch] = useState('')

  useEffect(() => { refreshMembers() }, [refreshMembers])

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Membros</h1>
        <p className="text-muted text-sm">{members.length} membros ativos</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="input pl-9"
          placeholder="Buscar membro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <Users size={40} className="text-border" />
          <p>{search ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((member) => (
            <div key={member.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-primary-light font-bold text-sm shrink-0">
                {member.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{member.name}</p>
                <p className="text-muted text-xs truncate">{member.email}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {member.roles.map((role) => (
                    <span key={role} className="badge bg-primary-ghost text-primary-lighter border border-primary/20 text-xs">
                      {ROLE_LABELS[role] ?? role}
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0">
                {member.isActive ? (
                  <UserCheck size={16} className="text-success" />
                ) : (
                  <UserX size={16} className="text-muted" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
