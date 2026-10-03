import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import type { Profile } from './lib/types'
import { useStore } from './data/store'
import { useAuth } from './data/session'
import Landing from './pages/Landing'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import ContractTemplates from './pages/ContractTemplates'
import ProfilePage from './pages/Profile'
import { NewDoc, OpenDoc } from './pages/Editor'
import { Forgot, SignIn, SignUp } from './pages/Auth'
import Admin from './pages/Admin'
import Privacy from './pages/Privacy'

/** Pages inside the app need an account and a profile. Without an account people go to sign in, without a profile to setup. */
function Private({ children }: { children: (profile: Profile) => ReactElement }) {
  const { data, ready } = useStore()
  const { session } = useAuth()
  if (!ready) return null
  if (!session) return <Navigate to="/signin" replace />
  if (!data.profile) return <Navigate to="/setup" replace />
  return children(data.profile)
}

/** Setup is part of creating an account, so it needs one. */
function NeedsAccount({ children }: { children: ReactElement }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/signup" replace />
  return children
}

export default function App() {
  const { ready } = useStore()
  if (!ready) return null
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/setup" element={<NeedsAccount><Setup /></NeedsAccount>} />
        <Route path="/app" element={<Private>{(p) => <Dashboard profile={p} />}</Private>} />
        <Route path="/app/contract" element={<Private>{() => <ContractTemplates />}</Private>} />
        <Route path="/app/new/:type" element={<Private>{(p) => <NewDoc profile={p} />}</Private>} />
        <Route path="/app/doc/:id" element={<Private>{(p) => <OpenDoc profile={p} />}</Private>} />
        <Route path="/app/profile" element={<Private>{(p) => <ProfilePage profile={p} />}</Private>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
