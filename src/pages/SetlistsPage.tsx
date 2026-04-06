import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { List, Plus, Music, Calendar, X, Search, ArrowUp, ArrowDown } from 'lucide-react'
import type { Setlist, SetlistSong, Song } from '@/types'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'

const STATUS_LABELS = { draft: 'Rascunho', published: 'Publicado', archived: 'Arquivado' } as const
const STATUS_STYLES = {
  draft: 'bg-warning/10 text-warning border-warning/20',
  published: 'bg-success/10 text-success border-success/20',
  archived: 'bg-surface text-muted border-border',
}

// ─── Modal de edição de setlist ───────────────────────────────────────────────
function SetlistModal({
  setlist, onClose, onSaved,
}: { setlist: Partial<Setlist> | null; onClose: () => void; onSaved: () => void }) {
  const { currentMinistry, songs } = useApp()
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState<Partial<Setlist>>(
    setlist ?? { title: '', date: new Date(), status: 'draft', notes: '', songs: [] },
  )
  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>(setlist?.songs ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSongPicker, setShowSongPicker] = useState(false)
  const [songSearch, setSongSearch] = useState('')

  const usedIds = new Set(setlistSongs.map((ss) => ss.songId))
  const availableSongs = songs.filter(
    (s) =>
      !usedIds.has(s.id) &&
      (s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
        s.artist.toLowerCase().includes(songSearch.toLowerCase())),
  )

  function addSong(song: Song) {
    setSetlistSongs((prev) => [
      ...prev,
      { songId: song.id, order: prev.length + 1, song },
    ])
  }
  function removeSong(idx: number) {
    setSetlistSongs((prev) => prev.filter((_, i) => i !== idx).map((ss, i) => ({ ...ss, order: i + 1 })))
  }
  function moveUp(idx: number) {
    if (idx === 0) return
    setSetlistSongs((prev) => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next.map((ss, i) => ({ ...ss, order: i + 1 }))
    })
  }
  function moveDown(idx: number) {
    setSetlistSongs((prev) => {
      if (idx === prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next.map((ss, i) => ({ ...ss, order: i + 1 }))
    })
  }

  async function handleSave() {
    if (!currentMinistry) return
    if (!form.title?.trim()) { setError('Título obrigatório.'); return }
    setLoading(true)
    setError('')
    try {
      const payload = {
        title: form.title.trim(),
        date: form.date instanceof Date ? form.date.toISOString() : form.date,
        status: form.status ?? 'draft',
        notes: form.notes ?? '',
        ministry_id: currentMinistry.id,
      }
      let setlistId = setlist?.id
      if (setlistId) {
        const { error } = await supabase.from('setlists').update(payload).eq('id', setlistId)
        if (error) throw error
        // Limpa músicas antigas e reinseire
        await supabase.from('setlist_songs').delete().eq('setlist_id', setlistId)
      } else {
        const { data, error } = await supabase.from('setlists').insert(payload).select('id').single()
        if (error) throw error
        setlistId = data.id
      }
      if (setlistSongs.length > 0) {
        const songsPayload = setlistSongs.map((ss) => ({
          setlist_id: setlistId,
          song_id: ss.songId,
          order: ss.order,
          notes: ss.notes ?? '',
          transposed_key: ss.transposedKey ?? null,
        }))
        const { error } = await supabase.from('setlist_songs').insert(songsPayload)
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
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-white">{setlist?.id ? 'Editar setlist' : 'Nova setlist'}</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-muted mb-1">Título *</label>
              <input className="input" value={form.title ?? ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-muted mb-1">Data *</label>
              <input className="input" type="date"
                value={form.date ? new Date(form.date).toISOString().slice(0, 10) : today}
                onChange={(e) => setForm((f) => ({ ...f, date: new Date(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <input className="input" value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>

          {/* Músicas do setlist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted">Músicas ({setlistSongs.length})</label>
              <button onClick={() => setShowSongPicker((v) => !v)}
                className="text-xs text-primary-light hover:underline flex items-center gap-1">
                <Plus size={12} /> Adicionar música
              </button>
            </div>

            {/* Song picker */}
            {showSongPicker && (
              <div className="bg-surface border border-border rounded-lg p-3 mb-3 space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input className="input pl-8 text-sm py-1.5" placeholder="Buscar música..." value={songSearch} onChange={(e) => setSongSearch(e.target.value)} autoFocus />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {availableSongs.length === 0 ? (
                    <p className="text-muted text-xs text-center py-4">{songSearch ? 'Nenhuma música encontrada' : 'Todas as músicas já foram adicionadas'}</p>
                  ) : availableSongs.map((song) => (
                    <button key={song.id} onClick={() => { addSong(song); setSongSearch('') }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-alt transition-colors text-left">
                      <span className="text-xs font-bold text-primary-light w-6 shrink-0">{song.originalKey}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{song.title}</p>
                        <p className="text-xs text-muted truncate">{song.artist}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de músicas no setlist */}
            {setlistSongs.length === 0 ? (
              <p className="text-muted text-xs text-center py-4 bg-surface rounded-lg">
                Nenhuma música adicionada
              </p>
            ) : (
              <div className="space-y-1">
                {setlistSongs.map((ss, idx) => (
                  <div key={ss.songId} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2">
                    <span className="text-xs text-muted w-5 shrink-0">{idx + 1}</span>
                    <span className="text-xs font-bold text-primary-light w-6 shrink-0">{ss.song?.originalKey}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{ss.song?.title}</p>
                      <p className="text-xs text-muted truncate">{ss.song?.artist}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => moveUp(idx)} disabled={idx === 0}
                        className="p-1 text-muted hover:text-white disabled:opacity-30 transition-colors">
                        <ArrowUp size={13} />
                      </button>
                      <button onClick={() => moveDown(idx)} disabled={idx === setlistSongs.length - 1}
                        className="p-1 text-muted hover:text-white disabled:opacity-30 transition-colors">
                        <ArrowDown size={13} />
                      </button>
                      <button onClick={() => removeSong(idx)}
                        className="p-1 text-muted hover:text-error transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-error text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
          <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary">
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function SetlistsPage() {
  const { setlists, refreshSetlists, refreshSongs } = useApp()
  const [filter, setFilter] = useState<'all' | Setlist['status']>('all')
  const [selected, setSelected] = useState<Partial<Setlist> | null | undefined>(undefined)

  useEffect(() => {
    refreshSetlists()
    refreshSongs()
  }, [refreshSetlists, refreshSongs])

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

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'published', 'draft', 'archived'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-white')}>
            {f === 'all' ? `Todas (${setlists.length})` : `${STATUS_LABELS[f]} (${setlists.filter((s) => s.status === f).length})`}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <List size={40} className="text-border" />
          <p>Nenhuma setlist encontrada</p>
          <button onClick={() => setSelected(null)} className="btn-primary flex items-center gap-2 mt-2">
            <Plus size={16} /> Criar setlist
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((setlist) => (
            <button key={setlist.id} onClick={() => setSelected(setlist)}
              className="w-full card hover:border-primary/40 transition-colors text-left flex items-center gap-3">
              <div className="shrink-0 text-center w-10">
                <p className="text-lg font-bold text-primary-light leading-none">{new Date(setlist.date).getDate()}</p>
                <p className="text-xs text-muted">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][new Date(setlist.date).getDay()]}</p>
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
