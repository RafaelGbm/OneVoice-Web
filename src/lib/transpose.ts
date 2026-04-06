/**
 * Transposição de acordes — mesmo algoritmo do app mobile
 */
import { MusicalNote, NOTE_SEQUENCE } from '@/types'

function normalizeNote(note: string): MusicalNote {
  const map: Record<string, MusicalNote> = {
    'C#': MusicalNote.Db, 'D#': MusicalNote.Eb, 'F#': MusicalNote.Gb,
    'G#': MusicalNote.Ab, 'A#': MusicalNote.Bb,
  }
  return (map[note] ?? note) as MusicalNote
}

function semitones(from: MusicalNote, to: MusicalNote): number {
  const a = NOTE_SEQUENCE.indexOf(from)
  const b = NOTE_SEQUENCE.indexOf(to)
  return ((b - a) + 12) % 12
}

function transposeNote(note: string, steps: number): string {
  const normalized = normalizeNote(note)
  const idx = NOTE_SEQUENCE.indexOf(normalized)
  if (idx === -1) return note
  return NOTE_SEQUENCE[(idx + steps + 12) % 12]
}

export function transposeChords(text: string, fromKey: MusicalNote, toKey: MusicalNote): string {
  if (fromKey === toKey) return text
  const steps = semitones(fromKey, toKey)

  // Regex para acordes: nota + modificador opcional + qualidade + baixo opcional
  return text.replace(
    /\b([A-G][#b]?)((?:maj|min|m|aug|dim|sus|add|°|\d)*(?:\/[A-G][#b]?)?)\b/g,
    (_, root: string, quality: string) => {
      const transposed = transposeNote(root, steps)
      // Transpõe também o baixo do acorde (ex: G/B)
      const withBass = quality.replace(/\/([A-G][#b]?)/, (_: string, bass: string) => '/' + transposeNote(bass, steps))
      return transposed + withBass
    },
  )
}
