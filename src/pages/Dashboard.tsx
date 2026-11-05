import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Doc, Profile } from '../lib/types'
import { STATUS_LABEL, DOC_LABEL } from '../lib/constants'
import { balanceOf, statusOf, totals } from '../lib/calc'
import { fmtDate, longToday, money } from '../lib/format'
import { reminderMessage, waLink } from '../lib/whatsapp'
import type { ReminderTone } from '../lib/whatsapp'
import { startOf, periodName, isoDay, type Period } from '../lib/period'
import { AppHeader } from '../components/TopBar'
import { ReminderModal } from '../components/ReminderModal'
import { PeriodTabs } from '../components/PeriodTabs'
import { DocRow } from '../components/DocRow'
import { MakeSheet } from '../components/AppShell'
import { ThemeToggle } from '../components/ThemeToggle'
import { useSigned } from '../components/useSigned'
import { ContractIcon, InvoiceIcon, PenIcon, PeopleIcon, PlusIcon, ReceiptIcon, WhatsAppIcon } from '../components/Icons'
import { useStore } from '../data/store'
import { useAuth } from '../data/session'
import { Tour, tourDone, type TourStep } from '../components/Tour'
import { useToast } from '../components/Toast'

type Money = Record<string, number>
const add = (m: Money, c: string, v: number) => {
  if (v > 0) m[c] = (m[c] || 0) + v
}

/** Money grouped by currency, one line each. */
function Amounts({ map, fallback }: { map: Money; fallback: string }) {
  const keys = Object.keys(map).filter((k) => map[k] > 0)
  if (!keys.length) return <>{money(0, fallback)}</>
  return (
    <>
      {keys.map((k) => (
        <span key={k} className="a-amt">
          {money(map[k], k)}
        </span>
      ))}
    </>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Money received per month in the main currency: the last six months, or twelve for this year and all time. */
function monthly(docs: Doc[], currency: string, months: number) {
  const now = new Date()
  const keys: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const sums: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]))
  for (const d of docs) {
    if (d.currency !== currency) continue
    if (d.type === 'invoice') {
      for (const pm of d.payments) {
        const k = (pm.date || '').slice(0, 7)
        if (k in sums) sums[k] += Number(pm.amt) || 0
      }
    }
    const k = (d.issueDate || '').slice(0, 7)
    if (d.type === 'receipt' && !d.fromId && k in sums) sums[k] += totals(d).total
  }
  return keys.map((k) => ({ k, label: MONTHS[Number(k.slice(5)) - 1], v: sums[k] }))
}

function MoneyChart({ docs, currency, period }: { docs: Doc[]; currency: string; period: Period }) {
  const data = useMemo(() => monthly(docs, currency, period === 'year' || period === 'all' ? 12 : 6), [docs, currency, period])
  const max = Math.max(1, ...data.map((d) => d.v))
  const cur = data[data.length - 1]
  const prev = data[data.length - 2]
  const change = prev.v ? Math.round(((cur.v - prev.v) / prev.v) * 100) : null
  const best = data.reduce((a, b) => (b.v > a.v ? b : a), data[0])
  return (
    <section className="card a-chart" aria-label="Money received each month">
      <div className="a-charth">
        <div>
          <span>Money received this month</span>
          <b className="num">{money(cur.v, currency)}</b>
          {change !== null && <small className={change >= 0 ? 'up' : 'down'}>{(change >= 0 ? '+' : '') + change}% on last month</small>}
        </div>
        {best.v > 0 && (
          <div className="a-chartbest">
            <span>Best month</span>
            <b>
              {best.label} · {money(best.v, currency)}
            </b>
          </div>
        )}
      </div>
      <div className="a-bars" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map((d, i) => (
          <div key={d.k} className={'a-barcol' + (i === data.length - 1 ? ' now' : '')} title={`${d.label}: ${money(d.v, currency)}`}>
            <span className="a-bar" style={{ height: `${Math.max(3, (d.v / max) * 100)}%` }} />
            <small>{d.label}</small>
          </div>
        ))}
      </div>
    </section>
  )
}

/** The first time tour of Home. Targets that are not on this screen size are skipped by the tour itself. */
const tourSteps = (first: string): TourStep[] => [
  { title: `Welcome to Generate, ${first}.`, text: 'Here is a quick look around, so you know where everything is. It takes less than a minute.' },
  { target: '.a-side .a-newbtn, .a-tabs .a-new, .a-hellobtn', title: 'Make anything from here', text: 'Tap New to make an invoice, a receipt or a contract, or to sign a document someone sent you.' },
  { target: '[data-tour=filter]', title: 'Choose the time', text: 'Pick today, this week, this month, this year or all time. Every number on Home changes with it.' },
  { target: '[data-tour=money]', title: 'Your money at a glance', text: 'What came in, what you are still waiting for, what is overdue, and who has paid part.' },
  { target: '[data-tour=chart]', title: 'See how you are growing', text: 'Money received each month, with your best month at the top.' },
  { target: '[data-tour=counts]', title: 'Everything you made', text: 'Invoices, receipts, contracts, signed documents and customers. Tap any box to open its own page.' },
  { target: '[data-tour=owe]', title: 'Who owes you', text: 'Unpaid invoices, late ones first. Tap Remind to send a friendly, firm or final message on WhatsApp.' },
  { target: '.a-side nav, .a-tabs', title: 'Find your way around', text: 'Your documents, customers, profile and settings are always here.' },
  { target: '.a-sidefoot .a-theme, .a-phonetools .a-theme, .a-hellotools .a-theme', title: 'Make it yours', text: 'Switch between light and dark here. In Settings you can also pick your own accent colour.' },
  { title: 'You are all set.', text: 'Start with your first invoice. Your name, logo and signature are already on it.' },
]

/**
 * Home. One time filter drives everything here:
 * money (received, waiting, overdue, part paid), a chart of money received,
 * how much was made (invoices, receipts, contracts, signed documents, customers),
 * who still owes, and the latest documents.
 */
export default function Dashboard({ profile }: { profile: Profile }) {
  const nav = useNavigate()
  const toast = useToast()
  const { data, saveDoc } = useStore()
  const { signed } = useSigned()
  const [period, setPeriod] = useState<Period>('month')
  const [remind, setRemind] = useState<Doc | null>(null)
  const [making, setMaking] = useState(false)
  const { session } = useAuth()
  const [touring, setTouring] = useState(() => !!session && !tourDone(session.userId))
  const from = startOf(period)
  const first = (profile.owner || profile.name).trim().split(' ')[0]
  const steps = useMemo(() => tourSteps(first), [first])

  const s = useMemo(() => {
    const received: Money = {}
    const waiting: Money = {}
    const overdue: Money = {}
    const partLeft: Money = {}
    let partCount = 0
    let overdueCount = 0
    const made = { invoice: 0, receipt: 0, contract: 0 }
    for (const d of data.docs) {
      const inP = (d.issueDate || '') >= from
      if (inP) made[d.type]++
      if (d.type === 'invoice') {
        for (const pm of d.payments) if ((pm.date || '') >= from) add(received, d.currency, Number(pm.amt) || 0)
        if (!inP) continue
        const st = statusOf(d)
        const bal = balanceOf(d)
        if (st === 'sent' || st === 'part' || st === 'overdue') add(waiting, d.currency, bal)
        if (st === 'overdue') {
          add(overdue, d.currency, bal)
          overdueCount++
        }
        if (st === 'part') {
          partCount++
          add(partLeft, d.currency, bal)
        }
      } else if (d.type === 'receipt' && !d.fromId && inP) add(received, d.currency, totals(d).total)
    }
    const newCustomers = data.customers.filter((c) => isoDay(new Date(c.createdAt)) >= from).length
    const signedCount = signed.filter((r) => isoDay(new Date(r.createdAt)) >= from).length
    return { received, waiting, overdue, partLeft, partCount, overdueCount, made, newCustomers, signedCount }
  }, [data.docs, data.customers, signed, from])

  const owing = useMemo(() => {
    const rank = (d: Doc) => (statusOf(d) === 'overdue' ? 0 : 1)
    return data.docs
      .filter((d) => d.type === 'invoice' && ['sent', 'part', 'overdue'].includes(statusOf(d)) && balanceOf(d) > 0)
      .sort((a, b) => rank(a) - rank(b) || (a.dueDate || '').localeCompare(b.dueDate || ''))
  }, [data.docs])

  const recent = useMemo(() => [...data.docs].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5), [data.docs])

  const sendReminder = (tone: ReminderTone) => {
    if (!remind) return
    window.open(waLink(remind.client.phone, reminderMessage(remind, profile, tone)), '_blank')
    saveDoc({ ...remind, updatedAt: Date.now() })
    setRemind(null)
    toast('Reminder ready in WhatsApp')
  }

  const pname = periodName(period)
  const counts = [
    { to: '/app/invoices', icon: <InvoiceIcon />, c: 'invoice', n: s.made.invoice, k: 'Invoices made' },
    { to: '/app/receipts', icon: <ReceiptIcon />, c: 'receipt', n: s.made.receipt, k: 'Receipts issued' },
    { to: '/app/contracts', icon: <ContractIcon />, c: 'contract', n: s.made.contract, k: 'Contracts' },
    { to: '/app/signed', icon: <PenIcon />, c: 'signed', n: s.signedCount, k: 'Documents signed' },
    { to: '/app/customers', icon: <PeopleIcon />, c: 'people', n: data.customers.length, k: s.newCustomers ? `Customers, ${s.newCustomers} new` : 'Customers' },
  ]

  return (
    <>
      <AppHeader profile={profile} />
      <main className="wrap a-dash">
        <section className="a-hello">
          <div>
            <p className="a-date">{longToday()}</p>
            <h1>
              {greeting()}, <em>{first}.</em>
            </h1>
          </div>
          <div className="a-hellotools">
            <ThemeToggle />
            <button className="btn p a-hellobtn" onClick={() => setMaking(true)}>
              <PlusIcon />
              New
            </button>
          </div>
        </section>

        <div data-tour="filter">
          <PeriodTabs value={period} onChange={setPeriod} label="Show numbers for" />
        </div>

        <section data-tour="money" className="a-money" aria-label={'Money, ' + pname}>
          <div className="a-tile dk big">
            <span>Money received</span>
            <b className="num">
              <Amounts map={s.received} fallback={profile.currency} />
            </b>
            <small>{pname}</small>
          </div>
          <div className="a-tile">
            <span>Waiting to be paid</span>
            <b className="num">
              <Amounts map={s.waiting} fallback={profile.currency} />
            </b>
          </div>
          <div className={'a-tile' + (s.overdueCount ? ' late' : '')}>
            <span>Overdue</span>
            <b className="num">
              <Amounts map={s.overdue} fallback={profile.currency} />
            </b>
            <small>
              {s.overdueCount} {s.overdueCount === 1 ? 'invoice' : 'invoices'}
            </small>
          </div>
          <div className="a-tile">
            <span>Part paid</span>
            <b className="num">{s.partCount}</b>
            <small>
              <Amounts map={s.partLeft} fallback={profile.currency} /> still to come
            </small>
          </div>
        </section>

        <div data-tour="chart">
          <MoneyChart docs={data.docs} currency={profile.currency} period={period} />
        </div>

        <section data-tour="counts" className="a-counts" aria-label={'What you made, ' + pname}>
          {counts.map((x) => (
            <Link key={x.to} to={x.to} className="a-count">
              <span className={'a-dico ' + x.c}>{x.icon}</span>
              <b className="num">{x.n}</b>
              <span>{x.k}</span>
            </Link>
          ))}
        </section>

        <div className="a-cols2">
          <section aria-labelledby="owe-h" data-tour="owe">
            <div className="a-head">
              <h2 id="owe-h">
                Who owes <em>you</em>
              </h2>
              {owing.length > 0 && (
                <Link className="a-more" to="/app/invoices">
                  All invoices
                </Link>
              )}
            </div>
            <div className="card a-list">
              {owing.length ? (
                owing.slice(0, 5).map((d) => {
                  const st = statusOf(d)
                  return (
                    <div className="a-oweit" key={d.id}>
                      <button className="a-owebody" onClick={() => nav(`/app/doc/${d.id}`)}>
                        <b>{d.client.name || 'No client name'}</b>
                        <span className="mu small">
                          {DOC_LABEL[d.type]} {d.number}
                          {d.dueDate ? ` · due ${fmtDate(d.dueDate)}` : ''}
                        </span>
                      </button>
                      <span className="a-owenum">
                        <b className="num">{money(balanceOf(d), d.currency)}</b>
                        <span className={'bd ' + st}>{STATUS_LABEL[st]}</span>
                      </span>
                      <button
                        className="a-remind"
                        onClick={() => (d.client.phone ? setRemind(d) : toast('Add the client’s phone number to send a reminder'))}
                        aria-label={`Send ${d.client.name || 'this client'} a reminder on WhatsApp`}
                      >
                        <WhatsAppIcon />
                        <span>Remind</span>
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className="empty a-calm">
                  <b>Nobody owes you right now</b>
                  When an invoice is waiting to be paid, it shows here with a Remind button.
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="docs-h">
            <div className="a-head">
              <h2 id="docs-h">Recent documents</h2>
              {data.docs.length > 0 && (
                <Link className="a-more" to="/app/documents">
                  See all
                </Link>
              )}
            </div>
            <div className="card a-list">
              {recent.length ? (
                recent.map((d) => <DocRow key={d.id} d={d} profile={profile} download={false} />)
              ) : (
                <div className="empty a-calm">
                  <b>Nothing made yet</b>
                  <button className="btn p" style={{ marginTop: 12 }} onClick={() => setMaking(true)}>
                    Make your first document
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      {remind && <ReminderModal onClose={() => setRemind(null)} onPick={sendReminder} />}
      {making && <MakeSheet onClose={() => setMaking(false)} />}
      {touring && session && (
        <Tour
          userId={session.userId}
          steps={steps}
          onFinish={(make) => {
            setTouring(false)
            window.scrollTo(0, 0)
            if (make) nav('/app/new/invoice')
          }}
        />
      )}
    </>
  )
}
