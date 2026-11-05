import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Doc, DocType, Profile } from '../lib/types'
import { fmtDate, today } from '../lib/format'
import { startOf, periodName, isoDay, type Period } from '../lib/period'
import { PageHeader } from '../components/TopBar'
import { PeriodTabs } from '../components/PeriodTabs'
import { DocRow } from '../components/DocRow'
import { useSigned } from '../components/useSigned'
import { ContractIcon, InvoiceIcon, PenIcon, ReceiptIcon } from '../components/Icons'
import { useStore } from '../data/store'

const TYPES: [DocType | 'all', string][] = [
  ['all', 'All'],
  ['invoice', 'Invoices'],
  ['receipt', 'Receipts'],
  ['contract', 'Contracts'],
]

function dayLabel(day: string) {
  const y = new Date()
  y.setDate(y.getDate() - 1)
  if (day === today()) return 'Today'
  if (day === isoDay(y)) return 'Yesterday'
  return fmtDate(day)
}

/** Everything made, grouped by day. The counts at the top open each kind of document on its own page. */
export default function Documents({ profile }: { profile: Profile }) {
  const nav = useNavigate()
  const { data } = useStore()
  const { signed } = useSigned()
  const [period, setPeriod] = useState<Period>('month')
  const [type, setType] = useState<DocType | 'all'>('all')
  const [q, setQ] = useState('')
  const from = startOf(period)

  const inPeriod = useMemo(() => data.docs.filter((d) => (d.issueDate || '') >= from), [data.docs, from])
  const count = (t: DocType) => inPeriod.filter((d) => d.type === t).length
  const signedCount = signed.filter((r) => isoDay(new Date(r.createdAt)) >= from).length

  const groups = useMemo(() => {
    const s = q.toLowerCase()
    const list = inPeriod
      .filter((d) => type === 'all' || d.type === type)
      .filter((d) => !s || `${d.client.name} ${d.number} ${d.title ?? ''}`.toLowerCase().includes(s))
      .sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || '') || b.updatedAt - a.updatedAt)
    const out: { day: string; docs: Doc[] }[] = []
    for (const d of list) {
      const last = out[out.length - 1]
      if (last && last.day === d.issueDate) last.docs.push(d)
      else out.push({ day: d.issueDate, docs: [d] })
    }
    return out
  }, [inPeriod, type, q])

  const cards = [
    { to: '/app/invoices', icon: <InvoiceIcon />, k: 'Invoices', n: count('invoice'), c: 'invoice' },
    { to: '/app/receipts', icon: <ReceiptIcon />, k: 'Receipts', n: count('receipt'), c: 'receipt' },
    { to: '/app/contracts', icon: <ContractIcon />, k: 'Contracts', n: count('contract'), c: 'contract' },
    { to: '/app/signed', icon: <PenIcon />, k: 'Signed documents', n: signedCount, c: 'signed' },
  ]

  return (
    <>
      <PageHeader title="Documents" onBack={() => nav('/app')} />
      <main className="wrap">
        <div className="a-pagehead">
          <div>
            <h1>
              All your <em>documents</em>
            </h1>
            <p className="mu">See what you made on any day, and download anything again.</p>
          </div>
        </div>

        <PeriodTabs value={period} onChange={setPeriod} />

        <section className="a-kinds" aria-label={'How many you made, ' + periodName(period)}>
          {cards.map((x) => (
            <Link key={x.to} to={x.to} className="a-kind">
              <span className={'a-dico ' + x.c}>{x.icon}</span>
              <b className="num">{x.n}</b>
              <span>{x.k}</span>
            </Link>
          ))}
        </section>

        <div className="a-filter">
          <input type="search" placeholder="Search by client or number" aria-label="Search your documents" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="seg a-seg" role="tablist" aria-label="Kind">
            {TYPES.map(([v, l]) => (
              <button key={v} role="tab" aria-selected={type === v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {groups.length ? (
          groups.map((g) => (
            <section key={g.day} className="a-day">
              <h2 className="a-dayh">
                {dayLabel(g.day)}
                <span className="mu small">
                  {g.docs.length} {g.docs.length === 1 ? 'document' : 'documents'}
                </span>
              </h2>
              <div className="card a-list">
                {g.docs.map((d) => (
                  <DocRow key={d.id} d={d} profile={profile} showDate={false} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="card empty">
            <b>Nothing {period === 'all' ? 'here yet' : periodName(period)}</b>
            {period === 'all' ? 'Make your first invoice and it will show here.' : 'Try a longer time, or make something new.'}
          </div>
        )}
      </main>
    </>
  )
}
