/**
 * Modo Músico — visualização de cifras ao vivo com auto-scroll
 * Portado do MusicianModeScreen do app mobile
 */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { transposeChords } from '@/lib/transpose'
import { MusicalNote, NOTE_SEQUENCE } from '@/types'
import {
  ChevronLeft, ChevronRight, Play, Pause, Music, FileText,
  RefreshCw, ChevronDown,
} from 'lucide-react'
import { clsx } from 'clsx'

const TEXT_SIZES = { small: 'text-sm', medium: 'text-lg', large: 'text-2xl' }
const PERSONAL_KEYS_KEY = 'onevoice_personal_keys'

function loadPersonalKeys(): Record<string, MusicalNote> {
  try {
    const raw = localStorage.getItem(PERSONAL_KEYS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function savePersonalKeys(keys: Record<string, MusicalNote>) {
  localStorage.setItem(PERSONAL_KEYS_KEY, JSON.stringify(keys))
}

export function MusicianModePage() {
  const { setlists } = useApp()
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef(0)
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [showChords, setShowChords] = useState(true)
  const [showLyrics, setShowLyrics] = useState(false)
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('large')
  const [personalKeys, setPersonalKeys] = useState<Record<string, MusicalNote>>(loadPersonalKeys)
  const [showKeyMenu, setShowKeyMenu] = useState(false)

  // Próximo setlist publicado
  const activeSetlist = useMemo(() => {
    if (!setlists || setlists.length === 0) return null
    const now = Date.now() - 86400000
    return setlists
      .filter((s) => new Date(s.date).getTime() >= now && s.status !== 'archived')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null
  }, [setlists])

  const setlistSongs = useMemo(() => {
    if (!activeSetlist?.songs) return []
    return [...activeSetlist.songs].sort((a, b) => a.order - b.order)
  }, [activeSetlist])

  const currentSong = setlistSongs[currentIndex]?.song

  const currentKey = useMemo(() => {
    if (!currentSong) return null
    return personalKeys[currentSong.id] || currentSong.originalKey
  }, [currentSong, personalKeys])

  const transposedContent = useMemo(() => {
    if (!currentSong?.chords || !currentKey) return currentSong?.chords ?? ''
    if (currentKey === currentSong.originalKey) return currentSong.chords
    return transposeChords(currentSong.chords, currentSong.originalKey, currentKey)
  }, [currentSong, currentKey])

  // Auto-scroll
  useEffect(() => {
    if (isScrolling && scrollRef.current) {
      autoScrollTimer.current = setInterval(() => {
        scrollYRef.current += 0.8
        scrollRef.current?.scrollTo({ top: scrollYRef.current, behavior: 'instant' } as ScrollToOptions)
      }, 30)
    } else {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current)
        autoScrollTimer.current = null
      }
    }
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current)
        autoScrollTimer.current = null
      }
    }
  }, [isScrolling])

  const goToSong = useCallback((idx: number) => {
    if (idx >= 0 && idx < setlistSongs.length) {
      setCurrentIndex(idx)
      scrollYRef.current = 0
      scrollRef.current?.scrollTo({ top: 0 })
      setIsScrolling(false)
    }
  }, [setlistSongs.length])

  const setPersonalKey = useCallback((songId: string, key: MusicalNote) => {
    const updated = { ...personalKeys, [songId]: key }
    setPersonalKeys(updated)
    savePersonalKeys(updated)
    setShowKeyMenu(false)
  }, [personalKeys])

  const resetKey = useCallback(() => {
    if (!currentSong) return
    const updated = { ...personalKeys }
    delete updated[currentSong.id]
    setPersonalKeys(updated)
    savePersonalKeys(updated)
  }, [currentSong, personalKeys])

  const cycleFontSize = () => {
    const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large']
    const idx = sizes.indexOf(textSize)
    setTextSize(sizes[(idx + 1) % 3])
  }

  if (!activeSetlist || setlistSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <Music size={48} className="text-border" />
        <h2 className="text-xl font-bold text-white">Nenhum setlist ativo</h2>
        <p className="text-muted max-w-sm">
          O setlist precisa estar publicado e com data futura para aparecer aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen -m-4 lg:-m-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">{currentSong?.title ?? 'Música'}</p>
          <p className="text-xs text-muted">
            {currentSong?.artist && <>{currentSong.artist} · </>}
            {currentIndex + 1}/{setlistSongs.length}
            {currentSong?.bpm && <> · {currentSong.bpm} BPM</>}
          </p>
        </div>
        <button
          onClick={() => setIsScrolling((v) => !v)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
            isScrolling ? 'bg-success/20 text-success border border-success/30' : 'bg-surface text-muted hover:text-white border border-border',
          )}
        >
          {isScrolling ? <Pause size={14} /> : <Play size={14} />}
          {isScrolling ? 'Pausar' : 'Auto-scroll'}
        </button>
      </div>

      {/* Song strip */}
      <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-border bg-bg shrink-0 scrollbar-hide">
        {setlistSongs.map((item, idx) => (
          <button
            key={item.songId}
            onClick={() => goToSong(idx)}
            className={clsx(
              'shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap',
              idx === currentIndex
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-muted border-border hover:text-white',
            )}
          >
            {idx + 1}. {item.song?.title?.slice(0, 20) ?? 'Música'}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-bg shrink-0 flex-wrap">
        {/* Tom */}
        {currentSong && (
          <div className="relative">
            <button
              onClick={() => setShowKeyMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-primary/40 text-sm font-semibold transition-colors hover:border-primary"
            >
              <span className="text-muted text-xs">Tom</span>
              <span className="text-primary-light font-bold">{currentKey}</span>
              <ChevronDown size={12} className="text-muted" />
            </button>
            {showKeyMenu && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl p-3 z-50 shadow-xl w-56">
                <p className="text-xs text-muted mb-2 font-semibold">Selecionar tom</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {NOTE_SEQUENCE.map((note) => (
                    <button
                      key={note}
                      onClick={() => setPersonalKey(currentSong.id, note)}
                      className={clsx(
                        'py-1.5 rounded-lg text-sm font-bold border transition-colors',
                        currentKey === note
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-muted border-border hover:text-white hover:border-primary/40',
                      )}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reset tom */}
        {currentSong && personalKeys[currentSong.id] && (
          <button
            onClick={resetKey}
            title="Resetar tom"
            className="p-1.5 text-muted hover:text-primary-light transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        )}

        <div className="flex-1" />

        {/* Cifra/Letra */}
        <button
          onClick={() => { setShowChords(true); setShowLyrics(false) }}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
            showChords && !showLyrics
              ? 'bg-primary/10 text-primary-light border-primary/30'
              : 'bg-surface text-muted border-border hover:text-white',
          )}
        >
          <Music size={13} /> Cifras
        </button>
        <button
          onClick={() => { setShowLyrics(true); setShowChords(false) }}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
            showLyrics
              ? 'bg-primary/10 text-primary-light border-primary/30'
              : 'bg-surface text-muted border-border hover:text-white',
          )}
        >
          <FileText size={13} /> Letra
        </button>

        {/* Tamanho */}
        <button
          onClick={cycleFontSize}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface text-muted border border-border hover:text-white transition-colors"
        >
          {textSize === 'small' ? 'P' : textSize === 'medium' ? 'M' : 'G'}
        </button>
      </div>

      {/* Conteúdo */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4"
        onScroll={(e) => { scrollYRef.current = e.currentTarget.scrollTop }}
        onClick={() => { setShowKeyMenu(false) }}
      >
        {currentSong ? (
          <>
            {showChords && currentSong.chords && (
              <pre className={clsx('font-mono whitespace-pre-wrap text-purple-300 leading-8', TEXT_SIZES[textSize])}>
                {transposedContent}
              </pre>
            )}
            {showLyrics && currentSong.lyrics && (
              <pre className={clsx('whitespace-pre-wrap text-purple-300 leading-7', TEXT_SIZES[textSize === 'large' ? 'medium' : textSize])}>
                {currentSong.lyrics}
              </pre>
            )}
            {currentSong.capo && currentSong.capo > 0 && (
              <p className="text-muted text-sm mt-4">Capo: {currentSong.capo}ª casa</p>
            )}
            {!showChords && !showLyrics && (
              <p className="text-muted text-center mt-8">Selecione Cifras ou Letra acima.</p>
            )}
          </>
        ) : (
          <p className="text-muted text-center mt-8">Selecione uma música na lista acima.</p>
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card shrink-0">
        <button
          onClick={() => goToSong(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-muted hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={18} /> Anterior
        </button>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">{currentIndex + 1}</span>
          <span className="text-muted text-sm">/ {setlistSongs.length}</span>
        </div>
        <button
          onClick={() => goToSong(currentIndex + 1)}
          disabled={currentIndex === setlistSongs.length - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-muted hover:text-white disabled:opacity-30 transition-colors"
        >
          Próxima <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
