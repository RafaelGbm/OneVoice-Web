import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Ministry, Song, Setlist, TeamMember, SubscriptionInfo } from '@/types'
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

  // Actions
  setCurrentMinistry: (ministry: Ministry) => void
  refreshSongs: () => Promise<void>
  refreshSetlists: () => Promise<void>
  refreshMembers: () => Promise<void>
  signOut: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMinistry, setCurrentMinistry] = useState<Ministry | null>(null)
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    isActive: false,
    planKey: null,
  })

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
        setCurrentMinistry(null)
        setMinistries([])
        setSongs([])
        setSetlists([])
        setMembers([])
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Carrega ministérios quando o usuário autentica
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
        setCurrentMinistry(list[0])
      }
    }
  }

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

  // Recarrega dados quando o ministério muda
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
        setCurrentMinistry,
        refreshSongs,
        refreshSetlists,
        refreshMembers,
        signOut,
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
