import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { Profile } from '../lib/types'
import { useAuth } from '../data/session'
import { BrandMark } from './TopBar'
import { Modal } from './Modal'
import { ThemeToggle } from './ThemeToggle'
import { ContractIcon, FolderIcon, HomeIcon, InvoiceIcon, PenIcon, PeopleIcon, PlusIcon, ReceiptIcon, ShieldIcon, UserIcon } from './Icons'

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
const TAB_PAGES = ['/app', '/app/contract', '/app/documents', '/app/customers', '/app/profile', '/app/invoices', '/app/receipts', '/app/contracts', '/app/signed']

const SIDE = 'generate.side'
const readFolded = () => {
  try {
    return localStorage.getItem(SIDE) === 'folded'
  } catch {
    return false
  }
}

/**
 * The frame around every page inside the app.
 * On a laptop: a side bar with New, your business, every kind of document, customers and settings. It folds down to icons.
 * On a phone: tabs at the bottom, with a raised New button in the middle.
 */
export function AppShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const { pathname } = useLocation()
  const { session } = useAuth()
  const [sheet, setSheet] = useState(false)
  const [folded, setFolded] = useState(readFolded)
  const tabs = TAB_PAGES.includes(pathname)

  const fold = () => {
    setFolded((f) => {
      try {
        localStorage.setItem(SIDE, f ? 'open' : 'folded')
      } catch {
        /* remembered for this visit only */
      }
      return !f
    })
  }

  const link = (to: string, icon: ReactNode, label: string, end = false) => (
    <NavLink to={to} end={end} title={folded ? label : undefined}>
      {icon}
      <span>{label}</span>
    </NavLink>
  )

  return (
    <div className={'a-shell' + (tabs ? ' a-hastabs' : '') + (folded ? ' a-folded' : '')}>
      <aside className="a-side" aria-label="Main">
        <div className="a-sidetop">
          <Link to="/app" className="a-logo" aria-label="Generate home">
            <img className="full" src="./logo.png" alt="Generate" width={130} height={29} />
            <img className="mark" src="./favicon.png" alt="Generate" width={30} height={30} />
          </Link>
          <button className="a-fold" onClick={fold} aria-label={folded ? 'Open the menu' : 'Fold the menu'} title={folded ? 'Open the menu' : 'Fold the menu'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
              <path d="M9.5 4.5v15" />
              <path d={folded ? 'm13.5 10 2 2-2 2' : 'm15.5 10-2 2 2 2'} />
            </svg>
          </button>
        </div>
        <button className="a-newbtn" onClick={() => setSheet(true)} title={folded ? 'New' : undefined}>
          <PlusIcon />
          <span>New</span>
        </button>
        <Link to="/app/profile" className="a-biz" title={folded ? profile.name : undefined}>
          <BrandMark profile={profile} size={38} />
          <span>
            <b>{profile.name}</b>
            <small>View profile</small>
          </span>
        </Link>
        <nav>
          {link('/app', <HomeIcon />, 'Home', true)}
          {link('/app/documents', <FolderIcon />, 'All documents')}
          <p className="a-navh">Your work</p>
          {link('/app/invoices', <InvoiceIcon />, 'Invoices')}
          {link('/app/receipts', <ReceiptIcon />, 'Receipts')}
          {link('/app/contracts', <ContractIcon />, 'Contracts')}
          {link('/app/signed', <PenIcon />, 'Signed documents')}
          {link('/app/customers', <PeopleIcon />, 'Customers')}
          <p className="a-navh">You</p>
          {link('/app/profile', <UserIcon />, 'Profile and settings')}
          {session?.role === 'admin' && link('/admin', <ShieldIcon />, 'Owner page')}
        </nav>
        <div className="a-sidefoot">
          <ThemeToggle label={!folded} />
          <Link to="/" className="a-site" title={folded ? 'Generate homepage' : undefined}>
            <img src="./favicon.png" alt="" width={28} height={28} />
            <span>
              <b>Generate homepage</b>
              <small>Pricing, help and news</small>
            </span>
            <svg className="arr" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </Link>
        </div>
      </aside>

      <div className="a-main">{children}</div>

      {tabs && (
        <nav className="a-tabs" aria-label="Main">
          <NavLink to="/app" end>
            <HomeIcon />
            Home
          </NavLink>
          <NavLink to="/app/documents">
            <FolderIcon />
            Documents
          </NavLink>
          <button className="a-new" onClick={() => setSheet(true)} aria-label="Make something new">
            <PlusIcon />
          </button>
          <NavLink to="/app/customers">
            <PeopleIcon />
            Customers
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
