import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Doc, DocType, Profile } from '../lib/types'
import { DOC_LABEL, STATUS_LABEL } from '../lib/constants'
import { balanceOf, paidOf, statusOf, summarise, totals } from '../lib/calc'
import { fmtDate, longToday, money, today } from '../lib/format'
import { reminderMessage, waLink } from '../lib/whatsapp'
import type { ReminderTone } from '../lib/whatsapp'
import { AppHeader } from '../components/TopBar'
import { ReminderModal } from '../components/ReminderModal'
import { ContractIcon, InvoiceIcon, PenIcon, PeopleIcon, PlusIcon, ReceiptIcon, WhatsAppIcon } from '../components/Icons'
import { useStore } from '../data/store'
import { useToast } from '../components/Toast'


const TYPE_ICON: Record<DocType, JSX.Element> = { invoice: <InvoiceIcon />, receipt: <ReceiptIcon />, contract: <ContractIcon /> }

/** Money grouped by currency, one line each. */
function Amounts({ map, fallback }: { map: Record<string, number>; fallback: string }) {
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

/** A small stack of pages with a signature on top. Shown before the first document. */
function FirstDocArt() {
  return (
    <svg className="a-firstart" viewBox="0 0 220 150" aria-hidden="true">
      <rect x="62" y="22" width="96" height="120" rx="6" fill="var(--sf2)" stroke="var(--ln)" transform="rotate(-6 110 82)" />
      <rect x="62" y="14" width="96" height="124" rx="6" fill="var(--sf)" stroke="var(--ln)" />
      <rect x="62" y="14" width="96" height="26" rx="6" fill="var(--ink)" />
      <rect x="62" y="34" width="96" height="6" fill="var(--ink)" />
      <path d="M74 54h50M74 64h72M74 74h60M74 84h66" stroke="var(--ln)" strokeWidth="5" strokeLinecap="round" />
      <path
        className="a-firststroke"
        pathLength={1}
        d="M76 118 C80 100 88 100 87 112 C86 122 80 124 84 117 C88 109 95 109 94 117 C93 122 99 121 102 114 C106 108 111 109 110 116 C114 111 120 110 123 114 C127 120 135 106 142 110"
        fill="none"
        stroke="var(--clay)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Money received in each of the last six months, in the main currency. */
function useMonthly(docs: Doc[], currency: string) {
  return useMemo(() => {
    const now = new Date()
    const keys: string[] = []
    for (let i = 5; i >= 0; i--) {
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
  }, [docs, currency])
}

function MonthChart({ data, currency }: { data: { k: string; label: string; v: number }[]; currency: string }) {
  const max = Math.max(1, ...data.map((d) => d.v))
  const cur = data[data.length - 1]
  const prev = data[data.length - 2]
  const change = prev.v ? Math.round(((cur.v - prev.v) / prev.v) * 100) : null
  return (
    <section className="card a-chart" aria-label="Money received in the last six months">
      <div className="a-charth">
        <span>Received this month</span>
        <b className="num">{money(cur.v, currency)}</b>
        {change !== null && <small className={change >= 0 ? 'up' : 'down'}>{(change >= 0 ? '+' : '') + change}% on last month</small>}
      </div>
      <div className="a-bars">
        {data.map((d, i) => (
          <div key={d.k} className={'a-barcol' + (i === data.length - 1 ? ' now' : '')} title={`${d.label}: ${money(d.v, currency)}`}>
            <span className="a-bar" style={{ height: `${Math.max(4, (d.v / max) * 100)}%` }} />
            <small>{d.label}</small>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Dashboard({ profile }: { profile: Profile }) {
  const nav = useNavigate()
  const toast = useToast()
  const { data, saveDoc } = useStore()
  const [remind, setRemind] = useState<Doc | null>(null)

  const summary = useMemo(() => summarise(data.docs), [data.docs])
  const first = (profile.owner || profile.name).trim().split(' ')[0]

  const counts = useMemo(() => {
    let part = 0
    let drafts = 0
    for (const d of data.docs) {
      const st = statusOf(d)
      if (d.type === 'invoice' && st === 'part') part++
      if (st === 'draft') drafts++
    }
    return { part, drafts }
  }, [data.docs])

  // Who owes you: unpaid invoices that have gone out, late ones first, then by due date.
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

  const hasDocs = data.docs.length > 0
  const monthly = useMonthly(data.docs, profile.currency)
  const t = today()
  const todayMade = data.docs.filter((d) => d.issueDate === t).length
  const todayIn: Record<string, number> = {}
  for (const d of data.docs) {
    if (d.type === 'invoice') for (const pm of d.payments) if (pm.date === t) todayIn[d.currency] = (todayIn[d.currency] || 0) + (Number(pm.amt) || 0)
    if (d.type === 'receipt' && !d.fromId && d.issueDate === t) todayIn[d.currency] = (todayIn[d.currency] || 0) + totals(d).total
  }

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
          <button className="btn p a-hellobtn" onClick={() => nav('/app/new/invoice')}>
            <PlusIcon />
            New invoice
          </button>
        </section>

        <section className="a-tiles" aria-label="Your money at a glance">
          <div className="a-tile dk">
            <span>Received</span>
            <b className="num">
              <Amounts map={summary.received} fallback={profile.currency} />
            </b>
          </div>
          <div className="a-tile">
            <span>Waiting to be paid</span>
            <b className="num">
              <Amounts map={summary.waiting} fallback={profile.currency} />
            </b>
          </div>
          <div className="a-tile">
            <span>Part paid</span>
            <b className="num">{counts.part}</b>
          </div>
          <div className={'a-tile' + (summary.overdue ? ' late' : '')}>
            <span>Overdue</span>
            <b className="num">{summary.overdue}</b>
          </div>
        </section>

        <section className="a-quick" aria-label="Make something">
          <button className="a-q p" onClick={() => nav('/app/new/invoice')}>
            <InvoiceIcon />
            <span>
              New invoice<small>Bill a client</small>
            </span>
          </button>
          <button className="a-q" onClick={() => nav('/app/new/receipt')}>
            <ReceiptIcon />
            <span>
              Receipt<small>Money in</small>
            </span>
          </button>
          <button className="a-q" onClick={() => nav('/app/contract')}>
            <ContractIcon />
            <span>
              Contract<small>Agreements</small>
            </span>
          </button>
          <button className="a-q" onClick={() => nav('/app/sign')}>
            <PenIcon />
            <span>
              Sign<small>Any PDF</small>
            </span>
          </button>
        </section>

        <div className="a-cols">
        <div className="a-colmain">
        {owing.length > 0 && (
          <section className="a-owe" aria-labelledby="owe-h">
            <div className="a-head">
              <h2 id="owe-h">
                Who owes <em>you</em>
              </h2>
              <span className="mu small">
                {owing.length} {owing.length === 1 ? 'client' : 'clients'}
              </span>
            </div>
            <div className="card a-list">
              {owing.slice(0, 5).map((d) => {
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
              })}
            </div>
          </section>
        )}

        <section aria-labelledby="docs-h">
          <div className="a-head">
            <h2 id="docs-h">Recent documents</h2>
            {hasDocs && (
              <Link className="a-more" to="/app/documents">
                See all {data.docs.length}
              </Link>
            )}
          </div>
          {hasDocs ? (
            <div className="card a-list">
              {recent.map((d) => {
                const st = statusOf(d)
                const left = d.type === 'invoice' && (st === 'part' || (st === 'overdue' && paidOf(d) > 0)) ? money(balanceOf(d), d.currency) : ''
                const amount = d.type === 'contract' ? (d.fee ? money(d.fee, d.currency) : '') : money(totals(d).total, d.currency)
                return (
                  <button key={d.id} className="row" onClick={() => nav(`/app/doc/${d.id}`)}>
                    <span className="l">
                      <span className={'a-dico ' + d.type}>{TYPE_ICON[d.type]}</span>
                      <span>
                        <b>{d.client.name || (d.type === 'contract' && d.title) || 'No client yet'}</b>
                        <span className="mu small">
                          {DOC_LABEL[d.type]} {d.number} · {fmtDate(d.issueDate)}
                        </span>
                      </span>
                    </span>
                    <span className="r">
                      {amount && <b>{amount}</b>}
                      {left ? <span className="mu small">{left} left</span> : null}
                      <span className={'bd ' + st}>{STATUS_LABEL[st]}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="card a-first">
              <FirstDocArt />
              <h3>
                Your first invoice is <em>one tap</em> away.
              </h3>
              <p className="mu">Everything you make is saved here, so you can track it, change it and send it again.</p>
              <button className="btn p" onClick={() => nav('/app/new/invoice')}>
                Make my first invoice
              </button>
            </div>
          )}
          {counts.drafts > 0 && hasDocs && (
            <p className="mu small a-note">
              {counts.drafts} {counts.drafts === 1 ? 'document is' : 'documents are'} still a draft. Open one and send it when you are ready.
            </p>
          )}
        </section>
        </div>

        <aside className="a-colside">
          <section className="card a-today" aria-label="Today">
            <span className="a-cardlbl">Today</span>
            <div>
              <b className="num">{todayMade}</b>
              <span>{todayMade === 1 ? 'document made' : 'documents made'}</span>
            </div>
            <div>
              <b className="num">
                <Amounts map={todayIn} fallback={profile.currency} />
              </b>
              <span>received</span>
            </div>
            <Link className="a-more" to="/app/documents">
              See today’s summary
            </Link>
          </section>
          <MonthChart data={monthly} currency={profile.currency} />
          <section className="card a-cuscard">
            <span className="a-ico">
              <PeopleIcon />
            </span>
            <div>
              <b>
                {data.customers.length} {data.customers.length === 1 ? 'customer' : 'customers'}
              </b>
              <span className="mu small">Pick them when you make a document.</span>
            </div>
            <Link className="a-more" to="/app/customers">
              Open
            </Link>
          </section>
        </aside>
        </div>
      </main>
      {remind && <ReminderModal onClose={() => setRemind(null)} onPick={sendReminder} />}
    </>
  )
}
