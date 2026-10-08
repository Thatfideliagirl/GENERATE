import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DocType, Profile } from '../lib/types'
import { DOC_LABEL, STATUS_LABEL } from '../lib/constants'
import { balanceOf, paidOf, statusOf, summarise, totals } from '../lib/calc'
import { fmtDate, longToday, money } from '../lib/format'
import { AppHeader } from '../components/TopBar'
import { useStore } from '../data/store'

const FILTERS: [DocType | 'all', string][] = [
  ['all', 'All'],
  ['invoice', 'Invoices'],
  ['receipt', 'Receipts'],
  ['contract', 'Contracts'],
]

function Amounts({ map, fallback }: { map: Record<string, number>; fallback: string }) {
  const keys = Object.keys(map).filter((k) => map[k] > 0)
  if (!keys.length) return <>{money(0, fallback)}</>
  return (
    <>
      {keys.map((k, i) => (
        <span key={k}>
          {money(map[k], k)}
          {i < keys.length - 1 && <br />}
        </span>
      ))}
    </>
  )
}

export default function Dashboard({ profile }: { profile: Profile }) {
  const nav = useNavigate()
  const { data } = useStore()
  const [filter, setFilter] = useState<DocType | 'all'>('all')
  const [query, setQuery] = useState('')

  const summary = useMemo(() => summarise(data.docs), [data.docs])
  const first = (profile.owner || profile.name).trim().split(' ')[0]

  const docs = useMemo(() => {
    const q = query.toLowerCase()
    return [...data.docs]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .filter((d) => filter === 'all' || d.type === filter)
      .filter((d) => !q || `${d.client.name} ${d.number} ${d.title ?? ''}`.toLowerCase().includes(q))
  }, [data.docs, filter, query])

  return (
    <>
      <AppHeader profile={profile} />
      <main className="wrap">
        <section className="hello">
          <h1>Hello, {first}.</h1>
          <div className="mu">{longToday()}</div>
        </section>

        <section className="stats">
          <div className="st">
            <b>
              <Amounts map={summary.waiting} fallback={profile.currency} />
            </b>
            <span>Waiting to be paid</span>
          </div>
          <div className="st">
            <b>
              <Amounts map={summary.received} fallback={profile.currency} />
            </b>
            <span>Money received</span>
          </div>
          <div className="st">
            <b>{summary.overdue}</b>
            <span>Overdue invoices</span>
          </div>
          <div className="st">
            <b>{summary.count}</b>
            <span>Documents saved</span>
          </div>
        </section>

        <section className="mk">
          <button className="btn p" onClick={() => nav('/app/new/invoice')}>
            New invoice
          </button>
          <button className="btn" onClick={() => nav('/app/new/receipt')}>
            New receipt
          </button>
          <button className="btn" onClick={() => nav('/app/contract')}>
            New contract
          </button>
        </section>

        <h2>Your documents</h2>
        <div className="chips">
          {FILTERS.map(([value, label]) => (
            <button key={value} className={'chip' + (filter === value ? ' on' : '')} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
        <label className="f">
          <span>Search</span>
          <input type="search" placeholder="Client name or number" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        {docs.length === 0 ? (
          data.docs.length ? (
            <div className="empty">
              <b>No matches</b>Try another word or switch the filter.
            </div>
          ) : (
            <div className="empty">
              <b>Start with your first invoice</b>Everything you create is saved here, so you can track it, change it and send it again.
            </div>
          )
        ) : (
          docs.map((d) => {
            const st = statusOf(d)
            const left =
              d.type === 'invoice' && (st === 'part' || (st === 'overdue' && paidOf(d) > 0)) ? money(balanceOf(d), d.currency) : ''
            const amount = d.type === 'contract' ? (d.fee ? money(d.fee, d.currency) : '') : money(totals(d).total, d.currency)
            return (
              <button key={d.id} className="row" onClick={() => nav(`/app/doc/${d.id}`)}>
                <span className="l">
                  <b>{d.client.name || 'No client yet'}</b>
                  <span className="mu small">
                    {DOC_LABEL[d.type]} {d.number} on {fmtDate(d.issueDate)}
                  </span>
                </span>
                <span className="r">
                  <b>{amount}</b>
                  <br />
                  {left && (
                    <>
                      <span className="mu small">{left} left</span>
                      <br />
                    </>
                  )}
                  <span className={'bd ' + st}>{STATUS_LABEL[st]}</span>
                </span>
              </button>
            )
          })
        )}
      </main>
    </>
  )
}
