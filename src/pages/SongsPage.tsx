import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Music, Search, Plus, X, ExternalLink } from 'lucide-react'
import type { Song, MusicalNote } from '@/types'
import { NOTE_SEQUENCE } from '@/types'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'

function SongModal({ song, onClose, onSaved }: { song: Partial<Song> | null; onClose: () => void; onSaved: () => void }) {
  const { currentMinistry } = useApp()
  const [form, setForm] = useState<Partial<Song>>(
    song ?? { title: '', artist: '', originalKey: 'C' as MusicalNote, lyrics: '', chords: '' },
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
      if (song?.id) {
        const { error } = await supabase.from('songs').update(payload).eq('id', song.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('songs').insert(payload)
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-white">{song?.id ? 'Editar música' : 'Adicionar música'}</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-muted mb-1">Título *</label>
              <input className="input" value={form.title ?? ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-muted mb-1">Artista *</label>
              <input className="input" value={form.artist ?? ''} onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-muted mb-1">Tom original</label>
              <select className="input" value={form.originalKey ?? ''} onChange={(e) => setForm((f) => ({ ...f, originalKey: e.target.value as MusicalNote }))}>
                {NOTE_SEQUENCE.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">BPM</label>
              <input className="input" type="number" min={40} max={240} value={form.bpm ?? ''} onChange={(e) => setForm((f) => ({ ...f, bpm: Number(e.target.value) || undefined }))} />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Capo</label>
              <input className="input" type="number" min={0} max={12} value={form.capo ?? ''} onChange={(e) => setForm((f) => ({ ...f, capo: Number(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Link YouTube</label>
            <input className="input" type="url" placeholder="https://youtube.com/watch?v=..." value={form.youtubeUrl ?? ''} onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Cifra</label>
            <textarea className="input font-mono text-sm" rows={6} value={form.chords ?? ''} onChange={(e) => setForm((f) => ({ ...f, chords: e.target.value }))} placeholder="Cole a cifra aqui..." />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Letra</label>
            <textarea className="input text-sm" rows={6} value={form.lyrics ?? ''} onChange={(e) => setForm((f) => ({ ...f, lyrics: e.target.value }))} placeholder="Cole a letra aqui..." />
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
        </form>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
          <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary">{loading ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

export function SongsPage() {
  const { songs, refreshSongs } = useApp()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Partial<Song> | null | undefined>(undefined)

  useEffect(() => { refreshSongs() }, [refreshSongs])

  const filtered = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Músicas</h1>
          <p className="text-muted text-sm">{songs.length} músicas na biblioteca</p>
        </div>
        <button onClick={() => setSelected(null)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="input pl-9"
          placeholder="Buscar por título ou artista..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <Music size={40} className="text-border" />
          <p>{search ? 'Nenhuma música encontrada' : 'Nenhuma música cadastrada'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((song) => (
            <button
              key={song.id}
              onClick={() => setSelected(song)}
              className={clsx(
                'w-full card hover:border-primary/40 transition-colors text-left flex items-center gap-3',
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-primary-ghost border border-primary/20 flex items-center justify-center text-primary-light font-bold text-sm shrink-0">
                {song.originalKey}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{song.title}</p>
                <p className="text-muted text-sm truncate">{song.artist}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {song.bpm && <span className="text-xs text-muted">{song.bpm} BPM</span>}
                {song.youtubeUrl && <ExternalLink size={14} className="text-muted" />}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected !== undefined && (
        <SongModal song={selected} onClose={() => setSelected(undefined)} onSaved={refreshSongs} />
      )}
    </div>
  )
}
