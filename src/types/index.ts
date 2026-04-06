/**
 * Tipos compartilhados com o app mobile OneVoice
 */

export type UserRole =
  | 'guitarist'
  | 'keyboardist'
  | 'vocalist'
  | 'drummer'
  | 'bassist'
  | 'acoustic_guitarist'
  | 'minister'
  | 'admin'
  | 'owner'

export enum MusicalNote {
  C = 'C',
  Db = 'Db',
  D = 'D',
  Eb = 'Eb',
  E = 'E',
  F = 'F',
  Gb = 'Gb',
  G = 'G',
  Ab = 'Ab',
  A = 'A',
  Bb = 'Bb',
  B = 'B',
}

export const NOTE_SEQUENCE = [
  MusicalNote.C,
  MusicalNote.Db,
  MusicalNote.D,
  MusicalNote.Eb,
  MusicalNote.E,
  MusicalNote.F,
  MusicalNote.Gb,
  MusicalNote.G,
  MusicalNote.Ab,
  MusicalNote.A,
  MusicalNote.Bb,
  MusicalNote.B,
]

export interface Song {
  id: string
  title: string
  artist: string
  originalKey: MusicalNote
  lyrics: string
  chords: string
  bpm?: number
  capo?: number
  duration?: number
  youtubeUrl?: string
  ministryId: string
  createdAt: Date
  updatedAt: Date
}

export interface SetlistSong {
  songId: string
  order: number
  transposedKey?: MusicalNote
  notes?: string
  song?: Song
}

export interface Setlist {
  id: string
  ministryId: string
  title: string
  date: Date
  songs: SetlistSong[]
  notes?: string
  status: 'draft' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date
}

export interface TeamMember {
  id: string
  ministryId: string
  userId: string
  name: string
  email: string
  roles: UserRole[]
  profileImage?: string
  naipe?: string
  primaryNaipe?: string
  isActive: boolean
  joinedAt: Date
}

export interface Ministry {
  id: string
  name: string
  description?: string
  churchName?: string
  members: TeamMember[]
  songs?: Song[]
  setlists?: Setlist[]
  logo?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  profileImage?: string
  ministries: string[]
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionInfo {
  isActive: boolean
  planKey: 'free' | 'basic' | 'pro' | null
  trialEnd?: string
  currentPeriodEnd?: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  guitarist: 'Guitarrista',
  keyboardist: 'Tecladista',
  vocalist: 'Vocalista',
  drummer: 'Baterista',
  bassist: 'Baixista',
  acoustic_guitarist: 'Violonista',
  minister: 'Ministro(a)',
  admin: 'Administrador',
  owner: 'Líder',
}
