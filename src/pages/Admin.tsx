import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BRAND, BUSINESS_TYPES, TRADES } from '../lib/constants'
import { saveFile } from '../lib/pdf'
import { auth } from '../data/authService'
import type { Account } from '../data/auth'
import { useAuth } from '../data/session'
import { getActivity, type Activity } from '../lib/ownerStats'
import { listLeads, type Lead } from '../lib/leads'

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

  const [activity, setActivity] = useState<Activity | null | undefined>(undefined)
  const [leads, setLeads] = useState<Lead[] | null | undefined>(undefined)

  useEffect(() => {
    if (!isAdmin) return
    auth.listSignups().then(setRows, () => setFailed(true))
    getActivity().then(setActivity, () => setActivity(null))
    listLeads().then(setLeads, () => setLeads(null))
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
    const startToday = new Date()
    startToday.setHours(0, 0, 0, 0)
    const startMonth = new Date(startToday)
    startMonth.setDate(1)
    // Signups per day for the last 30 days.
    const days: { label: string; n: number; key: string }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(startToday)
      d.setDate(d.getDate() - i)
      days.push({ key: d.toDateString(), label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), n: 0 })
    }
    const byDay = new Map(days.map((d) => [d.key, d]))
    for (const r of all) {
      const hit = byDay.get(new Date(r.createdAt).toDateString())
      if (hit) hit.n++
    }
    const trades: Record<string, number> = {}
    for (const r of all) trades[tradeName(r.trade)] = (trades[tradeName(r.trade)] || 0) + 1
    const topTrades = Object.entries(trades)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
    return {
      total: all.length,
      today: all.filter((r) => r.createdAt >= startToday.getTime()).length,
      week: all.filter((r) => now - r.createdAt < WEEK).length,
      month: all.filter((r) => r.createdAt >= startMonth.getTime()).length,
      byType,
      days,
      topTrades,
    }
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
        <h1>
          Your Generate, <em>at a glance</em>
        </h1>
        <p className="adm-lead">Who is signing up and how much Generate is being used. Counts only: nobody's documents are ever opened here.</p>

        {auth.demo && (
          <p className="adm-demo" role="note">
            Demo mode: these numbers only cover accounts made in this browser. Once the site is online with Supabase, they cover everyone.
          </p>
        )}

        <section className="adm-stats4" aria-label="Signups">
          <div className="dk">
            <span>Total signups</span>
            <b className="num">{stats.total}</b>
          </div>
          <div>
            <span>Today</span>
            <b className="num">{stats.today}</b>
          </div>
          <div>
            <span>Last 7 days</span>
            <b className="num">{stats.week}</b>
          </div>
          <div>
            <span>This month</span>
            <b className="num">{stats.month}</b>
          </div>
        </section>

        <section className="adm-card" aria-label="Signups each day for the last 30 days">
          <div className="adm-cardh">
            <h2>Signups, last 30 days</h2>
            <span>{stats.days.reduce((a, d) => a + d.n, 0)} in total</span>
          </div>
          <div className="adm-bars">
            {stats.days.map((d, i) => {
              const max = Math.max(1, ...stats.days.map((x) => x.n))
              return (
                <div key={d.key} className="adm-barcol" title={`${d.label}: ${d.n}`}>
                  <span className="adm-bar" style={{ height: `${Math.max(3, (d.n / max) * 100)}%` }} />
                  {i % 5 === 4 || i === 29 ? <small>{d.label}</small> : <small aria-hidden="true">&nbsp;</small>}
                </div>
              )
            })}
          </div>
        </section>

        <div className="adm-two">
          <section className="adm-card" aria-label="How Generate is being used">
            <div className="adm-cardh">
              <h2>How it is being used</h2>
              <span>All time</span>
            </div>
            {activity === undefined ? (
              <p className="adm-note">Loading</p>
            ) : activity === null ? (
              <p className="adm-note">
                To see these numbers, run the file supabase/owner_stats.sql once in Supabase (SQL Editor, New query, paste, Run).
              </p>
            ) : (
              <div className="adm-grid">
                {[
                  ['Documents made', activity.documents],
                  ['Invoices', activity.invoices],
                  ['Receipts', activity.receipts],
                  ['Contracts', activity.contracts],
                  ['Customers saved', activity.customers],
                  ['Made in the last 7 days', activity.made_week],
                  ['Businesses active this week', activity.active_week],
                  ['Businesses that made a document', activity.with_documents],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <b className="num">{v as number}</b>
                    <span>{k as string}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="adm-card" aria-label="Who is signing up">
            <div className="adm-cardh">
              <h2>Who is signing up</h2>
            </div>
            {BUSINESS_TYPES.map(([k, n]) => {
              const v = stats.byType[k] ?? 0
              return (
                <div key={k} className="adm-hbar">
                  <span>{n}</span>
                  <i style={{ width: `${stats.total ? (v / stats.total) * 100 : 0}%` }} />
                  <b className="num">{v}</b>
                </div>
              )
            })}
            {stats.topTrades.length > 0 && <p className="adm-sub">What they sell or do</p>}
            {stats.topTrades.map(([n, v]) => (
              <div key={n} className="adm-hbar">
                <span>{n}</span>
                <i className="t" style={{ width: `${(v / stats.total) * 100}%` }} />
                <b className="num">{v}</b>
              </div>
            ))}
          </section>
        </div>

        <section className="adm-card" aria-label="Emails from free signing">
          <div className="adm-cardh">
            <h2>Emails from free signing</h2>
            {leads && leads.length > 0 && (
              <button
                className="btn"
                onClick={() => {
                  const body = ['Email,Date', ...leads.map((l) => `"${l.email}",${day(l.createdAt)}`)].join('\n')
                  saveFile(`${BRAND} free signing emails.csv`, new Blob([body], { type: 'text/csv' }))
                }}
              >
                Download emails
              </button>
            )}
          </div>
          {leads === undefined ? (
            <p className="adm-note">Loading</p>
          ) : leads === null ? (
            <p className="adm-note">To collect these, run the file supabase/leads.sql once in Supabase (SQL Editor, New query, paste, Run).</p>
          ) : leads.length === 0 ? (
            <p className="adm-note">No one has used free signing yet. Visitors who sign a document on the website leave their email here before downloading.</p>
          ) : (
            <>
              <div className="adm-grid adm-grid3">
                <div>
                  <b className="num">{leads.length}</b>
                  <span>Emails in total</span>
                </div>
                <div>
                  <b className="num">{leads.filter((l) => Date.now() - l.createdAt < WEEK).length}</b>
                  <span>In the last 7 days</span>
                </div>
                <div>
                  <b className="num">{leads.filter((l) => (rows ?? []).some((r) => r.email.toLowerCase() === l.email)).length}</b>
                  <span>Went on to sign up</span>
                </div>
              </div>
              <ul className="adm-leads">
                {leads.slice(0, 8).map((l, i) => (
                  <li key={i}>
                    <span>{l.email}</span>
                    <span className="num">{day(l.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="adm-card adm-soon">
          <h2>Visitors, countries and time spent</h2>
          <p>
            Once the site is online on Vercel, we switch on Vercel Web Analytics. It shows how many people visit, which countries they are in, which pages
            they open and how long they stay, without collecting anyone's personal details. Those numbers will appear here too.
          </p>
        </section>

        <h2 className="adm-listh">Everyone who signed up</h2>
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
