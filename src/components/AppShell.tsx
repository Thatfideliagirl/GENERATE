import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { Profile } from '../lib/types'
import { useAuth } from '../data/session'
import { BrandMark } from './TopBar'
import { Modal } from './Modal'
import { ContractIcon, HomeIcon, InvoiceIcon, PenIcon, PlusIcon, ReceiptIcon, ShieldIcon, UserIcon } from './Icons'

const MAKE = [
  { to: '/app/new/invoice', icon: <InvoiceIcon />, t: 'Invoice', d: 'Bill a client and track the payment' },
  { to: '/app/new/receipt', icon: <ReceiptIcon />, t: 'Receipt', d: 'Confirm money you have received' },
  { to: '/app/contract', icon: <ContractIcon />, t: 'Contract', d: 'Start from a ready agreement' },
  { to: '/app/sign', icon: <PenIcon />, t: 'Sign a document', d: 'Upload a PDF or photo and sign it' },
]

/** The list of things you can make. Opens from the New button on a phone. */
export function MakeSheet({ onClose }: { onClose: () => void }) {
  const nav = useNavigate()
  return (
    <Modal label="Make something new" onClose={onClose}>
      <h3 className="s a-sheet-h">What would you like to make?</h3>
      <div className="a-make">
        {MAKE.map((m) => (
          <button
            key={m.to}
            onClick={() => {
              onClose()
              nav(m.to)
            }}
          >
            <span className="a-ico">{m.icon}</span>
            <span>
              <b>{m.t}</b>
              <small>{m.d}</small>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

/** Where the bottom tabs show on a phone. Pages with their own action bar keep the bottom of the screen for it. */
const TAB_PAGES = ['/app', '/app/contract']

/**
 * The frame around every page inside the app.
 * On a laptop: a quiet side bar with your business and everything you can make.
 * On a phone: four tabs at the bottom, with a raised New button in the middle.
 */
export function AppShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const { pathname } = useLocation()
  const { session } = useAuth()
  const [sheet, setSheet] = useState(false)
  const tabs = TAB_PAGES.includes(pathname)

  return (
    <div className={'a-shell' + (tabs ? ' a-hastabs' : '')}>
      <aside className="a-side" aria-label="Main">
        <Link to="/app" className="a-logo" aria-label="Generate home">
          <img src="./logo.png" alt="Generate" width={130} height={29} />
        </Link>
        <Link to="/app/profile" className="a-biz">
          <BrandMark profile={profile} size={38} />
          <span>
            <b>{profile.name}</b>
            <small>View profile</small>
          </span>
        </Link>
        <nav>
          <NavLink to="/app" end>
            <HomeIcon />
            Home
          </NavLink>
          <p className="a-navh">Make</p>
          {MAKE.map((m) => (
            <NavLink key={m.to} to={m.to}>
              {m.icon}
              {m.t}
            </NavLink>
          ))}
          <p className="a-navh">You</p>
          <NavLink to="/app/profile">
            <UserIcon />
            Profile
          </NavLink>
          {session?.role === 'admin' && (
            <NavLink to="/admin">
              <ShieldIcon />
              Owner page
            </NavLink>
          )}
        </nav>
        <p className="a-sidefoot">Your documents stay on your account.</p>
      </aside>

      <div className="a-main">{children}</div>

      {tabs && (
        <nav className="a-tabs" aria-label="Main">
          <NavLink to="/app" end>
            <HomeIcon />
            Home
          </NavLink>
          <NavLink to="/app/sign">
            <PenIcon />
            Sign
          </NavLink>
          <button className="a-new" onClick={() => setSheet(true)} aria-label="Make something new">
            <PlusIcon />
          </button>
          <NavLink to="/app/contract">
            <ContractIcon />
            Contracts
          </NavLink>
          <NavLink to="/app/profile">
            <UserIcon />
            Profile
          </NavLink>
        </nav>
      )}
      {sheet && <MakeSheet onClose={() => setSheet(false)} />}
    </div>
  )
}
