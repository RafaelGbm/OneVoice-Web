import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Music, Search, Plus, X, ExternalLink, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import type { Song, MusicalNote } from '@/types'
import { NOTE_SEQUENCE } from '@/types'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import { transposeChords } from '@/lib/transpose'

// ─── Modal de visualização ────────────────────────────────────────────────────
function SongViewModal({ song, onClose }: { song: Song; onClose: () => void }) {
  const [viewKey, setViewKey] = useState<MusicalNote>(song.originalKey)
  const [tab, setTab] = useState<'chords' | 'lyrics'>('chords')
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm')

  const keyIdx = NOTE_SEQUENCE.indexOf(viewKey)
  function prevKey() { setViewKey(NOTE_SEQUENCE[(keyIdx - 1 + 12) % 12]) }
  function nextKey() { setViewKey(NOTE_SEQUENCE[(keyIdx + 1) % 12]) }

  const content = tab === 'chords'
    ? transposeChords(song.chords || '', song.originalKey, viewKey)
    : song.lyrics || ''

  const fontClass = { sm: 'text-sm', base: 'text-base', lg: 'text-lg' }[fontSize]

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold text-white">{song.title}</h2>
            <p className="text-muted text-sm">{song.artist}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white ml-4"><X size={18} /></button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0 flex-wrap">
          {/* Tab cifra/letra */}
          <div className="flex bg-surface rounded-lg p-0.5 gap-0.5">
            {(['chords', 'lyrics'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  tab === t ? 'bg-primary text-white' : 'text-muted hover:text-white')}>
                {t === 'chords' ? 'Cifra' : 'Letra'}
              </button>
            ))}
          </div>

          {/* Tom */}
          <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
            <button onClick={prevKey} className="p-1 text-muted hover:text-white transition-colors"><ChevronLeft size={14} /></button>
            <span className="text-white font-bold text-sm w-8 text-center">{viewKey}</span>
            <button onClick={nextKey} className="p-1 text-muted hover:text-white transition-colors"><ChevronRight size={14} /></button>
          </div>
          {viewKey !== song.originalKey && (
            <button onClick={() => setViewKey(song.originalKey)} className="text-xs text-muted hover:text-primary-light transition-colors">
              ↺ Tom original ({song.originalKey})
            </button>
          )}

          {/* Tamanho */}
          <button onClick={() => setFontSize((f) => f === 'sm' ? 'base' : f === 'base' ? 'lg' : 'sm')}
            className="text-xs text-muted hover:text-white px-2 py-1 bg-surface rounded-lg transition-colors">
            A{fontSize === 'lg' ? '↓' : '↑'}
          </button>

          {song.bpm && <span className="text-xs text-muted ml-auto">{song.bpm} BPM</span>}
          {song.capo && song.capo > 0 && <span className="text-xs text-muted">Capo {song.capo}</span>}
          {song.youtubeUrl && (
            <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer"
              className="text-muted hover:text-error transition-colors">
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Content */}
        <pre className={clsx('flex-1 overflow-y-auto p-5 font-mono whitespace-pre-wrap text-white/90 leading-relaxed', fontClass)}>
          {content || <span className="text-muted italic">Nenhum conteúdo cadastrado.</span>}
        </pre>
      </div>
    </div>
  )
}

// ─── Modal de edição ──────────────────────────────────────────────────────────
function SongEditModal({ song, onClose, onSaved }: { song: Partial<Song> | null; onClose: () => void; onSaved: () => void }) {
  const { currentMinistry } = useApp()
  const [form, setForm] = useState<Partial<Song>>(
    song ?? { title: '', artist: '', originalKey: 'C' as MusicalNote, lyrics: '', chords: '' },
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!currentMinistry) return
    if (!form.title?.trim()) { setError('Título obrigatório.'); return }
    if (!form.artist?.trim()) { setError('Artista obrigatório.'); return }
    setLoading(true)
    setError('')
    try {
      const payload = {
        title: form.title?.trim(),
        artist: form.artist?.trim(),
        original_key: form.originalKey,
        lyrics: form.lyrics ?? '',
        chords: form.chords ?? '',
        bpm: form.bpm ?? null,
        capo: form.capo ?? 0,
        youtube_url: form.youtubeUrl ?? null,
        ministry_id: currentMinistry.id,
      }
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-white">{song?.id ? 'Editar música' : 'Adicionar música'}</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-muted mb-1">Título *</label>
              <input className="input" value={form.title ?? ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm text-muted mb-1">Artista *</label>
              <input className="input" value={form.artist ?? ''} onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-muted mb-1">Tom original</label>
              <select className="input" value={form.originalKey ?? 'C'} onChange={(e) => setForm((f) => ({ ...f, originalKey: e.target.value as MusicalNote }))}>
                {NOTE_SEQUENCE.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">BPM</label>
              <input className="input" type="number" min={30} max={300} value={form.bpm ?? ''} onChange={(e) => setForm((f) => ({ ...f, bpm: Number(e.target.value) || undefined }))} />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Capo</label>
              <input className="input" type="number" min={0} max={12} value={form.capo ?? 0} onChange={(e) => setForm((f) => ({ ...f, capo: Number(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Link YouTube</label>
            <input className="input" type="url" placeholder="https://youtube.com/watch?v=..." value={form.youtubeUrl ?? ''} onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Cifra</label>
            <textarea className="input font-mono text-sm" rows={8} value={form.chords ?? ''} onChange={(e) => setForm((f) => ({ ...f, chords: e.target.value }))} placeholder="Cole a cifra aqui..." />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Letra</label>
            <textarea className="input text-sm" rows={6} value={form.lyrics ?? ''} onChange={(e) => setForm((f) => ({ ...f, lyrics: e.target.value }))} placeholder="Cole a letra aqui..." />
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
        </form>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
          <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary">{loading ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function SongsPage() {
  const { songs, refreshSongs } = useApp()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Partial<Song> | null | undefined>(undefined)
  const [viewing, setViewing] = useState<Song | null>(null)

  useEffect(() => { refreshSongs() }, [refreshSongs])

  const filtered = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase()),
  )

  const isAdmin = true // TODO: derivar de useApp quando tiver role no contexto

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Músicas</h1>
          <p className="text-muted text-sm">{songs.length} músicas na biblioteca</p>
        </div>
        {isAdmin && (
          <button onClick={() => setEditing(null)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Adicionar
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input className="input pl-9" placeholder="Buscar por título ou artista..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <Music size={40} className="text-border" />
          <p>{search ? 'Nenhuma música encontrada' : 'Nenhuma música cadastrada'}</p>
          {!search && isAdmin && (
            <button onClick={() => setEditing(null)} className="btn-primary flex items-center gap-2 mt-2">
              <Plus size={16} /> Adicionar primeira música
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((song) => (
            <div key={song.id} className="card hover:border-border-alt transition-colors flex items-center gap-3">
              {/* Tom */}
              <div className="w-10 h-10 rounded-lg bg-primary-ghost border border-primary/20 flex items-center justify-center text-primary-light font-bold text-sm shrink-0">
                {song.originalKey}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{song.title}</p>
                <p className="text-muted text-sm truncate">{song.artist}</p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 shrink-0 text-xs text-muted">
                {song.bpm && <span>{song.bpm} BPM</span>}
                {song.capo != null && song.capo > 0 && <span>Capo {song.capo}</span>}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 shrink-0">
                {song.youtubeUrl && (
                  <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-muted hover:text-error transition-colors" title="Abrir no YouTube">
                    <ExternalLink size={15} />
                  </a>
                )}
                <button onClick={() => setViewing(song)}
                  className="p-1.5 text-muted hover:text-primary-light transition-colors" title="Ver cifra/letra">
                  <Eye size={15} />
                </button>
                {isAdmin && (
                  <button onClick={() => setEditing(song)}
                    className="p-1.5 text-muted hover:text-white transition-colors" title="Editar">
                    <Plus size={15} className="rotate-45" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <SongEditModal song={editing} onClose={() => setEditing(undefined)} onSaved={refreshSongs} />
      )}
      {viewing && (
        <SongViewModal song={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
