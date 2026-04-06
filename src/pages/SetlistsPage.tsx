import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { List, Plus, Music, Calendar, X } from 'lucide-react'
import type { Setlist } from '@/types'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'

const STATUS_LABELS = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
} as const

const STATUS_STYLES = {
  draft: 'bg-warning/10 text-warning border-warning/20',
  published: 'bg-success/10 text-success border-success/20',
  archived: 'bg-surface text-muted border-border',
}

function SetlistModal({ setlist, onClose, onSaved }: { setlist: Partial<Setlist> | null; onClose: () => void; onSaved: () => void }) {
  const { currentMinistry } = useApp()
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState<Partial<Setlist>>(
    setlist ?? { title: '', date: new Date(), status: 'draft', notes: '' },
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!currentMinistry) return
    setLoading(true)
    setError('')
    try {
      const payload = { ...form, ministry_id: currentMinistry.id }
      if (setlist?.id) {
        const { error } = await supabase.from('setlists').update(payload).eq('id', setlist.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('setlists').insert(payload)
        if (error) throw error
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-white">{setlist?.id ? 'Editar setlist' : 'Nova setlist'}</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Título *</label>
            <input className="input" value={form.title ?? ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Data *</label>
            <input
              className="input"
              type="date"
              value={form.date ? new Date(form.date).toISOString().slice(0, 10) : today}
              onChange={(e) => setForm((f) => ({ ...f, date: new Date(e.target.value) }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Status</label>
            <select className="input" value={form.status ?? 'draft'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Setlist['status'] }))}>
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Observações</label>
            <textarea className="input text-sm" rows={3} value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function SetlistsPage() {
  const { setlists, refreshSetlists } = useApp()
  const [filter, setFilter] = useState<'all' | Setlist['status']>('all')
  const [selected, setSelected] = useState<Partial<Setlist> | null | undefined>(undefined)

  useEffect(() => { refreshSetlists() }, [refreshSetlists])

  const filtered = setlists.filter((s) => filter === 'all' || s.status === filter)
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Setlists</h1>
          <p className="text-muted text-sm">{setlists.length} setlists</p>
        </div>
        <button onClick={() => setSelected(null)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'draft', 'published', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-white',
            )}
          >
            {f === 'all' ? 'Todas' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <List size={40} className="text-border" />
          <p>Nenhuma setlist encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((setlist) => (
            <button
              key={setlist.id}
              onClick={() => setSelected(setlist)}
              className="w-full card hover:border-primary/40 transition-colors text-left flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary-light shrink-0">
                <List size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{setlist.title}</p>
                <p className="text-muted text-sm flex items-center gap-1 mt-0.5">
                  <Calendar size={12} />
                  {new Date(setlist.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted flex items-center gap-1">
                  <Music size={11} /> {setlist.songs?.length ?? 0}
                </span>
                <span className={`badge border ${STATUS_STYLES[setlist.status]}`}>
                  {STATUS_LABELS[setlist.status]}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected !== undefined && (
        <SetlistModal setlist={selected} onClose={() => setSelected(undefined)} onSaved={refreshSetlists} />
      )}
    </div>
  )
}
