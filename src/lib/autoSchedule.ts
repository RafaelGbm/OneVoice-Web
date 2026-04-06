/**
 * Auto Escala — portado do app mobile (AsyncStorage → localStorage)
 * Algoritmo de geração de escala balanceada com ML de frequência
 */

import { supabase } from './supabase'
import type { TeamMember } from '@/types'

export type MemberGender = 'female' | 'male' | 'other' | 'unspecified'
export type VocalNaipe = 'soprano' | 'contralto' | 'tenor' | 'baixo_vocal' | 'none'

export interface MemberProfile {
  email: string
  instruments: string[]
  vocals: string[]
  services: string[]
  primaryService?: string
  canSingWhilePlaying?: boolean
  gender: MemberGender
  primaryNaipe: VocalNaipe
}

export interface GeneratedSchedule {
  dateKey: string
  dateLabel: string
  base: { slot: string; member: TeamMember | null }[]
  vocals: { slot: string; member: TeamMember | null }[]
  missing: string[]
  notes: string[]
}

export interface PublishedSchedule {
  id: string
  ministryId: string
  dateKey: string
  dateLabel: string
  data: Pick<GeneratedSchedule, 'base' | 'vocals' | 'missing' | 'notes'>
  publishedBy: string
  createdAt: Date
}

const PROFILE_MAP_KEY = 'onevoice_member_profile_map_v1'
const UNAVAILABILITY_MAP_KEY = 'onevoice_member_unavailability_map_v1'

const toEmailKey = (email: string) => email.trim().toLowerCase()

const defaultProfile = (email: string): MemberProfile => ({
  email,
  instruments: [],
  vocals: [],
  services: [],
  gender: 'unspecified',
  primaryNaipe: 'none',
})

// ── Helpers de data ────────────────────────────────────────────

export function getNextSunday(from = new Date()): Date {
  const d = new Date(from)
  const diff = (7 - d.getDay()) % 7 || 7
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function toDateLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

// ── Perfis musicais (localStorage) ────────────────────────────

export function getMemberProfileMap(): Record<string, MemberProfile> {
  try {
    const raw = localStorage.getItem(PROFILE_MAP_KEY)
    return raw ? (JSON.parse(raw) as Record<string, MemberProfile>) : {}
  } catch {
    return {}
  }
}

export function saveMemberProfileMap(map: Record<string, MemberProfile>): void {
  localStorage.setItem(PROFILE_MAP_KEY, JSON.stringify(map))
}

export function upsertMemberProfile(email: string, patch: Partial<MemberProfile>): void {
  const key = toEmailKey(email)
  const map = getMemberProfileMap()
  const current = map[key] || defaultProfile(email)
  map[key] = {
    ...current,
    ...patch,
    email,
    instruments: patch.instruments ?? current.instruments,
    vocals: patch.vocals ?? current.vocals,
    services: patch.services ?? current.services,
    gender: patch.gender ?? current.gender,
    primaryNaipe: patch.primaryNaipe ?? current.primaryNaipe,
  }
  saveMemberProfileMap(map)
}

// ── Indisponibilidade (localStorage) ──────────────────────────

export function getMemberUnavailabilityMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(UNAVAILABILITY_MAP_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
  } catch {
    return {}
  }
}

export function saveMemberUnavailabilityMap(map: Record<string, string[]>): void {
  localStorage.setItem(UNAVAILABILITY_MAP_KEY, JSON.stringify(map))
}

export function toggleUnavailability(
  map: Record<string, string[]>,
  email: string,
  dateKey: string,
): Record<string, string[]> {
  const key = toEmailKey(email)
  const current = new Set(map[key] || [])
  if (current.has(dateKey)) current.delete(dateKey)
  else current.add(dateKey)
  return { ...map, [key]: [...current] }
}

// ── Supabase: publicar e buscar escalas ───────────────────────

export async function publishSchedule(
  schedule: GeneratedSchedule,
  ministryId: string,
  publishedBy: string,
): Promise<void> {
  const { dateKey, dateLabel, base, vocals, missing, notes } = schedule
  const { error } = await supabase
    .from('published_schedules')
    .upsert(
      {
        ministry_id: ministryId,
        date_key: dateKey,
        date_label: dateLabel,
        data: { base, vocals, missing, notes },
        published_by: publishedBy,
      },
      { onConflict: 'ministry_id,date_key' },
    )
  if (error) throw new Error(error.message)
}

export async function getRecentSchedules(
  ministryId: string,
  limit = 12,
): Promise<PublishedSchedule[]> {
  const { data, error } = await supabase
    .from('published_schedules')
    .select('*')
    .eq('ministry_id', ministryId)
    .order('date_key', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    ministryId: row.ministry_id,
    dateKey: row.date_key,
    dateLabel: row.date_label,
    data: row.data,
    publishedBy: row.published_by,
    createdAt: new Date(row.created_at),
  }))
}

// ── ML: frequência e streak ────────────────────────────────────

export function buildMemberFrequencyMap(schedules: PublishedSchedule[]): Record<string, number> {
  const freq: Record<string, number> = {}
  for (const s of schedules) {
    for (const item of [...s.data.base, ...s.data.vocals]) {
      if (item.member?.email) {
        const key = toEmailKey(item.member.email)
        freq[key] = (freq[key] ?? 0) + 1
      }
    }
  }
  return freq
}

export function buildConsecutiveStreakMap(schedules: PublishedSchedule[]): Record<string, number> {
  const sorted = [...schedules].sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  const streak: Record<string, number> = {}
  const emailsVisto = new Set<string>()
  const presencePorData = new Map<string, Set<string>>()

  for (const s of sorted) {
    const presentes = new Set<string>()
    for (const item of [...s.data.base, ...s.data.vocals]) {
      if (item.member?.email) {
        const key = toEmailKey(item.member.email)
        presentes.add(key)
        emailsVisto.add(key)
      }
    }
    presencePorData.set(s.dateKey, presentes)
  }

  const datas = sorted.map((s) => s.dateKey)
  for (const email of emailsVisto) {
    let count = 0
    for (const data of datas) {
      if (presencePorData.get(data)?.has(email)) count++
      else break
    }
    streak[email] = count
  }

  return streak
}

// ── Algoritmo de geração ───────────────────────────────────────

const MAX_CONSECUTIVE_WEEKS = 3

const BASE_SLOTS = [
  { role: 'drummer', label: 'Bateria' },
  { role: 'bassist', label: 'Baixo' },
  { role: 'acoustic_guitarist', label: 'Violão' },
  { role: 'guitarist', label: 'Guitarra' },
] as const

const ROLE_TO_SERVICE: Record<string, string> = {
  guitarist: 'guitarra',
  acoustic_guitarist: 'violao',
  bassist: 'baixo',
  drummer: 'bateria',
  keyboardist: 'teclado',
}

const VOCAL_PRIMARY_IDS = new Set(['soprano', 'contralto', 'tenor', 'baixo_vocal'])

function hasRole(member: TeamMember, role: string): boolean {
  return member.roles.includes(role as never)
}

function isAvailable(
  member: TeamMember,
  dateKey: string,
  unavailableMap: Record<string, string[]>,
): boolean {
  const list = unavailableMap[toEmailKey(member.email)] || []
  return !list.includes(dateKey)
}

function buildScore(
  member: TeamMember,
  profile: MemberProfile,
  targetNaipe: VocalNaipe,
  preferredGender: MemberGender | null,
): number {
  let score = 0
  if (profile.primaryNaipe === targetNaipe) score += 40
  if (profile.vocals.includes(targetNaipe)) score += 30
  if (hasRole(member, 'vocalist')) score += 15
  if (preferredGender) {
    if (profile.gender === preferredGender) score += 20
    else if (profile.gender === 'unspecified') score += 5
    else score -= 8
  } else if (profile.gender !== 'unspecified') {
    score += 5
  }
  score -= member.roles.length
  return score
}

function pickByRole(
  candidates: TeamMember[],
  role: string,
  usedEmails: Set<string>,
  frequencyMap: Record<string, number>,
  profileMap: Record<string, MemberProfile>,
  primaryOnly: boolean,
  streakMap: Record<string, number>,
): TeamMember | null {
  let roleCandidates = candidates.filter(
    (m) => hasRole(m, role) && !usedEmails.has(toEmailKey(m.email)),
  )

  if (primaryOnly) {
    const serviceKey = ROLE_TO_SERVICE[role]
    if (serviceKey) {
      const primaryCandidates = roleCandidates.filter((m) => {
        const primary = profileMap[toEmailKey(m.email)]?.primaryService
        return !primary || primary === serviceKey
      })
      if (primaryCandidates.length > 0) roleCandidates = primaryCandidates
    }
  }

  if (roleCandidates.length <= 1) return roleCandidates[0] ?? null

  const semStreakLong = roleCandidates.filter(
    (m) => (streakMap[toEmailKey(m.email)] ?? 0) < MAX_CONSECUTIVE_WEEKS,
  )
  if (semStreakLong.length > 0) roleCandidates = semStreakLong

  return roleCandidates.sort(
    (a, b) =>
      a.roles.length - b.roles.length ||
      (frequencyMap[toEmailKey(a.email)] ?? 0) - (frequencyMap[toEmailKey(b.email)] ?? 0) ||
      a.name.localeCompare(b.name),
  )[0]
}

function pickVocal(
  candidates: TeamMember[],
  profiles: Record<string, MemberProfile>,
  usedEmails: Set<string>,
  targetNaipe: VocalNaipe,
  preferredGender: MemberGender | null,
  frequencyMap: Record<string, number>,
  primaryOnly: boolean,
  streakMap: Record<string, number>,
): TeamMember | null {
  let available = candidates.filter((m) => !usedEmails.has(toEmailKey(m.email)))

  if (primaryOnly) {
    const primaryCandidates = available.filter((m) => {
      const primary = profiles[toEmailKey(m.email)]?.primaryService
      return !primary || VOCAL_PRIMARY_IDS.has(primary)
    })
    if (primaryCandidates.length > 0) available = primaryCandidates
  }

  if (available.length > 1) {
    const semStreakLong = available.filter(
      (m) => (streakMap[toEmailKey(m.email)] ?? 0) < MAX_CONSECUTIVE_WEEKS,
    )
    if (semStreakLong.length > 0) available = semStreakLong
  }

  const applyFreqPenalty = available.length > 1
  const ranked = available
    .map((member) => {
      const profile = profiles[toEmailKey(member.email)] || defaultProfile(member.email)
      const base = buildScore(member, profile, targetNaipe, preferredGender)
      const freqPenalty = applyFreqPenalty
        ? Math.min((frequencyMap[toEmailKey(member.email)] ?? 0) * 2, 10)
        : 0
      return { member, score: base - freqPenalty }
    })
    .sort((a, b) => b.score - a.score || a.member.name.localeCompare(b.member.name))

  return ranked[0]?.member ?? null
}

export function generateBalancedSchedule(params: {
  members: TeamMember[]
  unavailableMap: Record<string, string[]>
  profileMap: Record<string, MemberProfile>
  targetDate: Date
  frequencyMap?: Record<string, number>
  consecutiveStreakMap?: Record<string, number>
}): GeneratedSchedule {
  const {
    members,
    unavailableMap,
    profileMap,
    targetDate,
    frequencyMap = {},
    consecutiveStreakMap = {},
  } = params
  const dateKey = toDateKey(targetDate)
  const dateLabel = toDateLabel(targetDate)

  const activeAvailable = members.filter(
    (m) => m.isActive && isAvailable(m, dateKey, unavailableMap),
  )
  const usedEmails = new Set<string>()
  const base: { slot: string; member: TeamMember | null }[] = []
  const vocals: { slot: string; member: TeamMember | null }[] = []
  const missing: string[] = []
  const notes: string[] = []
  const instrumentEmails = new Set<string>()

  const assignToInstrument = (picked: TeamMember) => {
    const profile = profileMap[toEmailKey(picked.email)] || defaultProfile(picked.email)
    if (profile.canSingWhilePlaying) instrumentEmails.add(toEmailKey(picked.email))
    else usedEmails.add(toEmailKey(picked.email))
  }

  const instrumentExcluded = () => new Set([...usedEmails, ...instrumentEmails])

  // Passo 1: slots com preferência primária
  const baseResults: (TeamMember | null)[] = BASE_SLOTS.map((slot) => {
    const picked = pickByRole(
      activeAvailable, slot.role, instrumentExcluded(), frequencyMap, profileMap, true, consecutiveStreakMap,
    )
    if (picked) assignToInstrument(picked)
    return picked ?? null
  })

  // Passo 2: slots vazios aceitam qualquer disponível
  for (let i = 0; i < BASE_SLOTS.length; i++) {
    const slot = BASE_SLOTS[i]
    if (baseResults[i]) {
      base.push({ slot: slot.label, member: baseResults[i] })
    } else {
      const picked = pickByRole(
        activeAvailable, slot.role, instrumentExcluded(), frequencyMap, profileMap, false, consecutiveStreakMap,
      )
      if (picked) {
        assignToInstrument(picked)
        base.push({ slot: slot.label, member: picked })
      } else {
        base.push({ slot: slot.label, member: null })
        missing.push(slot.label)
      }
    }
  }

  const vocalCandidates = activeAvailable.filter(
    (m) =>
      hasRole(m, 'vocalist') ||
      (profileMap[toEmailKey(m.email)]?.vocals.length || 0) > 0 ||
      instrumentEmails.has(toEmailKey(m.email)),
  )

  const vocalRules: { slot: string; naipe: VocalNaipe; preferredGender: MemberGender | null }[] = [
    { slot: 'Soprano', naipe: 'soprano', preferredGender: 'female' },
    { slot: 'Contralto', naipe: 'contralto', preferredGender: null },
    { slot: 'Tenor', naipe: 'tenor', preferredGender: 'male' },
  ]

  const assignToVocal = (picked: TeamMember) => {
    instrumentEmails.delete(toEmailKey(picked.email))
    usedEmails.add(toEmailKey(picked.email))
  }

  const vocalResults: (TeamMember | null)[] = vocalRules.map((rule) => {
    const picked = pickVocal(
      vocalCandidates, profileMap, usedEmails, rule.naipe, rule.preferredGender, frequencyMap, true, consecutiveStreakMap,
    )
    if (picked) assignToVocal(picked)
    return picked ?? null
  })

  for (let i = 0; i < vocalRules.length; i++) {
    if (!vocalResults[i]) {
      const rule = vocalRules[i]
      const picked = pickVocal(
        vocalCandidates, profileMap, usedEmails, rule.naipe, rule.preferredGender, frequencyMap, false, consecutiveStreakMap,
      )
      if (picked) assignToVocal(picked)
      vocalResults[i] = picked ?? null
    }
  }

  for (let i = 0; i < vocalRules.length; i++) {
    const rule = vocalRules[i]
    const picked = vocalResults[i]
    if (picked) {
      vocals.push({ slot: rule.slot, member: picked })
      const profile = profileMap[toEmailKey(picked.email)] || defaultProfile(picked.email)
      if (rule.slot === 'Soprano' && profile.gender !== 'female' && profile.gender !== 'unspecified')
        notes.push(`Soprano sem preferência feminina: ${picked.name}.`)
      if (rule.slot === 'Tenor' && profile.gender !== 'male' && profile.gender !== 'unspecified')
        notes.push(`Tenor sem preferência masculina: ${picked.name}.`)
      if (profile.primaryNaipe === 'none' || profile.gender === 'unspecified')
        notes.push(`Perfil incompleto para ${picked.name}. Complete gênero e naipe para melhorar o equilíbrio.`)
    } else {
      vocals.push({ slot: rule.slot, member: null })
      missing.push(rule.slot)
    }
  }

  if (activeAvailable.length === 0) notes.push('Nenhum membro disponível para esta data.')

  return { dateKey, dateLabel, base, vocals, missing, notes }
}

// ── Inferência de gênero por naipe ────────────────────────────

export function inferGenderFromNaipe(primaryNaipe: VocalNaipe, vocals: string[]): MemberGender {
  if (primaryNaipe === 'soprano') return 'female'
  if (primaryNaipe === 'tenor' || primaryNaipe === 'baixo_vocal') return 'male'
  const hasSoprano = vocals.includes('soprano')
  const hasTenor = vocals.includes('tenor') || vocals.includes('baixo_vocal')
  if (hasSoprano && !hasTenor) return 'female'
  if (hasTenor && !hasSoprano) return 'male'
  return 'unspecified'
}
