import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Ministry, Song, Setlist, TeamMember, SubscriptionInfo, UserRole } from '@/types'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface AppState {
  // Auth
  session: Session | null
  user: SupabaseUser | null
  loading: boolean

  // Ministério atual
  currentMinistry: Ministry | null
  ministries: Ministry[]

  // Dados
  songs: Song[]
  setlists: Setlist[]
  members: TeamMember[]

  // Assinatura
  subscription: SubscriptionInfo

  // Papel do usuário atual
  isAdmin: boolean
  isOwner: boolean
  currentMember: TeamMember | null

  // Actions básicas
  setCurrentMinistry: (ministry: Ministry) => void
  refreshSongs: () => Promise<void>
  refreshSetlists: () => Promise<void>
  refreshMembers: () => Promise<void>
  signOut: () => Promise<void>

  // Governança
  promoteMemberToAdmin: (memberId: string) => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  updateMinistry: (updates: { name?: string; churchName?: string }) => Promise<void>
  createInvite: (role: 'member' | 'admin', expiresMinutes: number) => Promise<{ token: string; expiresAt: string }>
  transferOwnership: (newOwnerMemberId: string) => Promise<void>
  leaveMinistry: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMinistry, setCurrentMinistryState] = useState<Ministry | null>(null)
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    isActive: false,
    planKey: null,
  })

  // Papel do usuário no ministério atual
  const currentMember = useMemo(
    () => members.find((m) => m.userId === user?.id) ?? null,
    [members, user?.id],
  )
  const isAdmin = useMemo(
    () => currentMember?.roles.includes('admin') || currentMember?.roles.includes('owner') || false,
    [currentMember],
  )
  const isOwner = useMemo(
    () => currentMember?.roles.includes('owner') || false,
    [currentMember],
  )

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (!newSession) {
        setCurrentMinistryState(null)
        setMinistries([])
        setSongs([])
        setSetlists([])
        setMembers([])
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    loadMinistries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadMinistries() {
    if (!user) return
    const { data } = await supabase
      .from('team_members')
      .select('ministryId:ministry_id, ministries(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (data && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = data.map((row: any) => row.ministries).filter(Boolean) as Ministry[]
      setMinistries(list)
      if (!currentMinistry && list.length > 0) {
        setCurrentMinistryState(list[0])
      }
    }
  }

  const setCurrentMinistry = useCallback((ministry: Ministry) => {
    setCurrentMinistryState(ministry)
  }, [])

  const refreshSongs = useCallback(async () => {
    if (!currentMinistry) return
    const { data } = await supabase
      .from('songs')
      .select('*')
      .eq('ministry_id', currentMinistry.id)
      .order('title')
    if (data) setSongs(data as unknown as Song[])
  }, [currentMinistry])

  const refreshSetlists = useCallback(async () => {
    if (!currentMinistry) return
    const { data } = await supabase
      .from('setlists')
      .select('*, setlist_songs(*, songs(*))')
      .eq('ministry_id', currentMinistry.id)
      .order('date', { ascending: false })
    if (data) setSetlists(data as unknown as Setlist[])
  }, [currentMinistry])

  const refreshMembers = useCallback(async () => {
    if (!currentMinistry) return
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('ministry_id', currentMinistry.id)
      .eq('is_active', true)
      .order('name')
    if (data) setMembers(data as unknown as TeamMember[])
  }, [currentMinistry])

  useEffect(() => {
    if (!currentMinistry) return
    refreshSongs()
    refreshSetlists()
    refreshMembers()
    loadSubscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMinistry?.id])

  async function loadSubscription() {
    if (!user) return
    const { data } = await supabase
      .from('subscriptions')
      .select('status, plan_key, trial_end, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle()

    if (data) {
      setSubscription({
        isActive: data.status === 'active' || data.status === 'trialing',
        planKey: data.plan_key ?? null,
        trialEnd: data.trial_end,
        currentPeriodEnd: data.current_period_end,
      })
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  // ── Governança ─────────────────────────────────────────────

  const promoteMemberToAdmin = useCallback(async (memberId: string) => {
    const target = members.find((m) => m.id === memberId)
    if (!target) throw new Error('Membro não encontrado')
    const nextRoles = Array.from(new Set<UserRole>([...target.roles, 'admin']))
    const { error } = await supabase
      .from('team_members')
      .update({ roles: nextRoles })
      .eq('id', memberId)
    if (error) throw new Error(error.message)
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, roles: nextRoles } : m))
  }, [members])

  const removeMember = useCallback(async (memberId: string) => {
    if (!currentMinistry) return
    const { error } = await supabase.rpc('remove_member_from_ministry', {
      p_ministry_id: currentMinistry.id,
      p_target_user_id: members.find((m) => m.id === memberId)?.userId,
    })
    if (error) {
      // Fallback: marcar como inativo diretamente
      const { error: e2 } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('id', memberId)
      if (e2) throw new Error(e2.message)
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }, [currentMinistry, members])

  const updateMinistry = useCallback(async (updates: { name?: string; churchName?: string }) => {
    if (!currentMinistry) return
    const payload: Record<string, unknown> = {}
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.churchName !== undefined) payload.church_name = updates.churchName
    const { error } = await supabase
      .from('ministries')
      .update(payload)
      .eq('id', currentMinistry.id)
    if (error) throw new Error(error.message)
    setCurrentMinistryState((prev) =>
      prev ? { ...prev, ...updates } : prev,
    )
    setMinistries((prev) =>
      prev.map((m) => m.id === currentMinistry.id ? { ...m, ...updates } : m),
    )
  }, [currentMinistry])

  const createInvite = useCallback(async (
    role: 'member' | 'admin',
    expiresMinutes: number,
  ): Promise<{ token: string; expiresAt: string }> => {
    if (!currentMinistry) throw new Error('Nenhum ministério ativo')
    const { data, error } = await supabase.rpc('create_ministry_invite', {
      p_ministry_id: currentMinistry.id,
      p_invite_role: role,
      p_expires_minutes: expiresMinutes,
      p_max_uses: 1,
    })
    if (error) throw new Error(error.message)
    const row = Array.isArray(data) ? data[0] : data
    return { token: row?.token as string, expiresAt: row?.expires_at as string }
  }, [currentMinistry])

  const transferOwnership = useCallback(async (newOwnerMemberId: string) => {
    if (!currentMinistry) return
    const target = members.find((m) => m.id === newOwnerMemberId)
    if (!target) throw new Error('Membro não encontrado')
    const { error } = await supabase.rpc('transfer_ownership', {
      p_ministry_id: currentMinistry.id,
      p_new_owner_user_id: target.userId,
    })
    if (error) throw new Error(error.message)
    await refreshMembers()
  }, [currentMinistry, members, refreshMembers])

  const leaveMinistry = useCallback(async () => {
    if (!currentMinistry) return
    const { error } = await supabase.rpc('leave_ministry', {
      p_ministry_id: currentMinistry.id,
    })
    if (error) throw new Error(error.message)
    await loadMinistries()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMinistry])

  return (
    <AppContext.Provider
      value={{
        session,
        user,
        loading,
        currentMinistry,
        ministries,
        songs,
        setlists,
        members,
        subscription,
        isAdmin,
        isOwner,
        currentMember,
        setCurrentMinistry,
        refreshSongs,
        refreshSetlists,
        refreshMembers,
        signOut,
        promoteMemberToAdmin,
        removeMember,
        updateMinistry,
        createInvite,
        transferOwnership,
        leaveMinistry,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider')
  return ctx
}
