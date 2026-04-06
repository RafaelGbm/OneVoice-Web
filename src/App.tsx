import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from '@/context/AppContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthPage } from '@/pages/AuthPage'
import { HomePage } from '@/pages/HomePage'
import { SongsPage } from '@/pages/SongsPage'
import { SetlistsPage } from '@/pages/SetlistsPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { EscalaPage } from '@/pages/EscalaPage'
import { MembersPage } from '@/pages/MembersPage'
import { SettingsPage } from '@/pages/SettingsPage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useApp()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { session } = useApp()

  return (
    <Routes>
      <Route
        path="/auth"
        element={session ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route
        path="/"
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="songs" element={<SongsPage />} />
        <Route path="setlists" element={<SetlistsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="escala" element={<EscalaPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}
