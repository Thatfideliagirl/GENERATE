import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import type { Profile } from './lib/types'
import { useStore } from './data/store'
import Landing from './pages/Landing'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import ContractTemplates from './pages/ContractTemplates'
import ProfilePage from './pages/Profile'
import { NewDoc, OpenDoc } from './pages/Editor'

/** Pages inside the app need a profile. Without one, people are sent to the landing page. */
function Private({ children }: { children: (profile: Profile) => ReactElement }) {
  const { data, ready } = useStore()
  if (!ready) return null
  if (!data.profile) return <Navigate to="/" replace />
  return children(data.profile)
}

export default function App() {
  const { ready } = useStore()
  if (!ready) return null
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<Setup />} />
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
