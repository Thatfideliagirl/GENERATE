import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import type { Profile } from './lib/types'
import { useStore } from './data/store'
import { useAuth } from './data/session'
import Landing from './pages/Landing'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import ContractTemplates from './pages/ContractTemplates'
import ProfilePage, { ProfileEdit } from './pages/Profile'
import { NewDoc, OpenDoc } from './pages/Editor'
import { Forgot, Reset, SignIn, SignUp } from './pages/Auth'
import Admin from './pages/Admin'
import SignDocument from './pages/SignDocument'
import Privacy from './pages/Privacy'
import { AppShell } from './components/AppShell'
import Pricing from './pages/Pricing'
import Documents from './pages/Documents'
import { DocSection, SignedDocs } from './pages/Sections'
import { CustomerPage, CustomersPage } from './pages/Customers'

/** Pages inside the app need an account and a profile. Without an account people go to sign in, without a profile to setup. */
function Private({ children }: { children: (profile: Profile) => ReactElement }) {
  const { data, ready } = useStore()
  const { session } = useAuth()
  if (!ready) return null
  if (!session) return <Navigate to="/signin" replace />
  if (!data.profile) return <Navigate to="/setup" replace />
  return <AppShell profile={data.profile}>{children(data.profile)}</AppShell>
}

/** Setup is part of creating an account, so it needs one. */
function NeedsAccount({ children }: { children: ReactElement }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/signup" replace />
  return children
}

export default function App() {
  const { ready, loadError, retry } = useStore()
  if (!ready) return null
  if (loadError) {
    return (
      <main className="wrap" style={{ paddingTop: 60 }}>
        <h1>We could not load your documents.</h1>
        <p className="mu">Check your connection and try again. Nothing has been changed or lost.</p>
        <button className="btn p" onClick={retry}>
          Try again
        </button>
      </main>
    )
  }
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/setup" element={<NeedsAccount><Setup /></NeedsAccount>} />
        <Route path="/app" element={<Private>{(p) => <Dashboard profile={p} />}</Private>} />
        <Route path="/app/sign" element={<Private>{(p) => <SignDocument profile={p} />}</Private>} />
        <Route path="/app/contract" element={<Private>{(p) => <ContractTemplates profile={p} />}</Private>} />
        <Route path="/app/new/:type" element={<Private>{(p) => <NewDoc profile={p} />}</Private>} />
        <Route path="/app/doc/:id" element={<Private>{(p) => <OpenDoc profile={p} />}</Private>} />
        <Route path="/app/profile" element={<Private>{(p) => <ProfilePage profile={p} />}</Private>} />
        <Route path="/app/profile/edit" element={<Private>{(p) => <ProfileEdit profile={p} />}</Private>} />
        <Route path="/app/invoices" element={<Private>{(p) => <DocSection key="i" profile={p} type="invoice" />}</Private>} />
        <Route path="/app/receipts" element={<Private>{(p) => <DocSection key="r" profile={p} type="receipt" />}</Private>} />
        <Route path="/app/contracts" element={<Private>{(p) => <DocSection key="c" profile={p} type="contract" />}</Private>} />
        <Route path="/app/signed" element={<Private>{() => <SignedDocs />}</Private>} />
        <Route path="/app/documents" element={<Private>{(p) => <Documents profile={p} />}</Private>} />
        <Route path="/app/customers" element={<Private>{() => <CustomersPage />}</Private>} />
        <Route path="/app/customers/:id" element={<Private>{(p) => <CustomerPage profile={p} />}</Private>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
