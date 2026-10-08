import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BRAND, BUSINESS_TYPES, TRADES } from '../lib/constants'
import { saveFile } from '../lib/pdf'
import { auth } from '../data/auth'
import type { Account } from '../data/auth'
import { useAuth } from '../data/session'

const KNOWN_TYPES = BUSINESS_TYPES.filter(([k]) => k !== 'other').map(([k]) => k)
const KNOWN_TRADES = Object.keys(TRADES).filter((k) => k !== 'other')
const typeName = (k: string) => BUSINESS_TYPES.find(([x]) => x === k)?.[1] ?? k
const isType = (k: string, want: string) => (want === 'other' ? !KNOWN_TYPES.includes(k) : k === want)
const isTrade = (k: string, want: string) => (want === 'other' ? !KNOWN_TRADES.includes(k) : k === want)
const tradeName = (k: string) => TRADES[k] ?? k
const day = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const WEEK = 7 * 24 * 3600 * 1000

/**
 * The owner page. It lists who signed up and nothing else.
 * It never loads, shows or exports anyone's invoices, receipts or contracts.
 */
export default function Admin() {
  const nav = useNavigate()
  const { session, ready, signOut } = useAuth()
  const [rows, setRows] = useState<Account[] | null>(null)
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [trade, setTrade] = useState('')
  const [failed, setFailed] = useState(false)
  const isAdmin = session?.role === 'admin'

  useEffect(() => {
    if (!isAdmin) return
    auth.listSignups().then(setRows, () => setFailed(true))
  }, [isAdmin])

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase()
    return (rows ?? []).filter(
      (r) =>
        (!type || isType(r.bizType, type)) &&
        (!trade || isTrade(r.trade, trade)) &&
        (!n || [r.name, r.business, r.email].some((t) => t.toLowerCase().includes(n))),
    )
  }, [rows, q, type, trade])

  const stats = useMemo(() => {
    const all = rows ?? []
    const now = Date.now()
    const byType = Object.fromEntries(BUSINESS_TYPES.map(([k]) => [k, all.filter((r) => isType(r.bizType, k)).length]))
    return { total: all.length, week: all.filter((r) => now - r.createdAt < WEEK).length, byType }
  }, [rows])

  if (!ready) return null
  if (!session) return <Navigate to="/signin" replace />
  if (!isAdmin) return <Navigate to="/app" replace />

  const csv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
    const head = ['Name', 'Business', 'Business type', 'Trade', 'Signed up', 'Email']
    const lines = shown.map((r) => [r.name, r.business, typeName(r.bizType), tradeName(r.trade), day(r.createdAt), r.email].map(esc).join(','))
    saveFile(`${BRAND} signups.csv`, new Blob([[head.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv' }))
  }

  return (
    <div className="adm">
      <header className="adm-top">
        <Link to="/" className="adm-logo" aria-label={`${BRAND} home`}>
          <img src="./logo.png" alt={BRAND} width={150} height={33} />
        </Link>
        <span className="adm-tag">Owner area</span>
        <span className="adm-gap" />
        <Link className="btn g" to="/app">
          My app
        </Link>
        <button
          className="btn g"
          onClick={async () => {
            await signOut()
            nav('/', { replace: true })
          }}
        >
          Sign out
        </button>
      </header>

      <main className="adm-main">
        <h1>Signups</h1>
        <p className="adm-lead">Everyone who has created an account, newest first.</p>

        {auth.demo && (
          <p className="adm-demo" role="note">
            Demo mode: this list only shows accounts made in this browser. Once Supabase is connected it will show everyone who signs up.
          </p>
        )}

        <section className="adm-stats" aria-label="Summary">
          <div>
            <b className="num">{stats.total}</b>
            <span>Total signups</span>
          </div>
          <div>
            <b className="num">{stats.week}</b>
            <span>In the last 7 days</span>
          </div>
          {BUSINESS_TYPES.map(([k, n]) => (
            <div key={k}>
              <b className="num">{stats.byType[k] ?? 0}</b>
              <span>{n}</span>
            </div>
          ))}
        </section>

        <section className="adm-tools" aria-label="Search and filter">
          <label>
            <span>Search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, business or email" />
          </label>
          <label>
            <span>Business type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All</option>
              {BUSINESS_TYPES.map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Trade</span>
            <select value={trade} onChange={(e) => setTrade(e.target.value)}>
              <option value="">All</option>
              {Object.entries(TRADES).map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" onClick={csv} disabled={!shown.length}>
            Download list
          </button>
        </section>

        {failed ? (
          <p className="adm-empty" role="alert">
            The list could not be loaded. Refresh the page and try again.
          </p>
        ) : rows == null ? (
          <p className="adm-empty">Loading</p>
        ) : shown.length === 0 ? (
          <p className="adm-empty">{rows.length ? 'No one matches that search.' : 'No signups yet. When someone creates an account, they will appear here.'}</p>
        ) : (
          <>
            <div className="adm-table" role="region" aria-label="Signups" tabIndex={0}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Business</th>
                    <th>Business type</th>
                    <th>Trade</th>
                    <th>Signed up</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.business}</td>
                      <td>{typeName(r.bizType)}</td>
                      <td>{tradeName(r.trade)}</td>
                      <td className="num">{day(r.createdAt)}</td>
                      <td>{r.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="adm-cards">
              {shown.map((r) => (
                <li key={r.id}>
                  <b>{r.business}</b>
                  <span>{r.name}</span>
                  <span>
                    {typeName(r.bizType)} · {tradeName(r.trade)}
                  </span>
                  <span>{r.email}</span>
                  <span className="num">{day(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <section className="adm-privacy">
          <h2>What you can and cannot see</h2>
          <p>
            You can see who signed up: name, business, type, trade, date and email. You cannot open anyone's invoices, receipts or contracts. This page does not load them at all, and the database will block it as well.{' '}
            <Link to="/privacy">Read the privacy page</Link>
          </p>
        </section>
      </main>
    </div>
  )
}
