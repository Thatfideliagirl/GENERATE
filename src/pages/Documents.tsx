import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Doc, DocType, Profile } from '../lib/types'
import { DOC_LABEL, STATUS_LABEL } from '../lib/constants'
import { statusOf, totals } from '../lib/calc'
import { fmtDate, money, today } from '../lib/format'
import { makePdf, pdfName, saveFile } from '../lib/pdf'
import { PageHeader } from '../components/TopBar'
import { ContractIcon, DownloadIcon, InvoiceIcon, ReceiptIcon } from '../components/Icons'
import { useStore } from '../data/store'
import { useToast } from '../components/Toast'

type Period = 'today' | 'week' | 'month' | 'all'
const PERIODS: [Period, string][] = [
  ['today', 'Today'],
  ['week', 'This week'],
  ['month', 'This month'],
  ['all', 'All time'],
]
const TYPES: [DocType | 'all', string][] = [
  ['all', 'All'],
  ['invoice', 'Invoices'],
  ['receipt', 'Receipts'],
  ['contract', 'Contracts'],
]
const TYPE_ICON: Record<DocType, JSX.Element> = { invoice: <InvoiceIcon />, receipt: <ReceiptIcon />, contract: <ContractIcon /> }

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

/** The first day of the period, as yyyy-mm-dd. Weeks start on Monday. */
function startOf(p: Period): string {
  const d = new Date()
  if (p === 'all') return '0000-00-00'
  if (p === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  if (p === 'month') d.setDate(1)
  return iso(d)
}

function dayLabel(day: string) {
  const t = today()
  const y = new Date()
  y.setDate(y.getDate() - 1)
  if (day === t) return 'Today'
  if (day === iso(y)) return 'Yesterday'
  return fmtDate(day)
}

const add = (m: Record<string, number>, k: string, v: number) => {
  if (v > 0) m[k] = (m[k] || 0) + v
}
const show = (m: Record<string, number>, fallback: string) => {
  const e = Object.entries(m)
  return e.length ? e.map(([k, v]) => money(v, k)).join(' · ') : money(0, fallback)
}

/** Everything made, grouped by day, with a summary of the chosen period and a quick download for each document. */
export default function Documents({ profile }: { profile: Profile }) {
  const nav = useNavigate()
  const toast = useToast()
  const { data } = useStore()
  const [period, setPeriod] = useState<Period>('month')
  const [type, setType] = useState<DocType | 'all'>('all')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState('')

  const from = startOf(period)

  const summary = useMemo(() => {
    const invoiced: Record<string, number> = {}
    const received: Record<string, number> = {}
    let made = 0
    let receipts = 0
    for (const d of data.docs) {
      const inPeriod = (d.issueDate || '') >= from
      if (inPeriod) made++
      if (d.type === 'invoice') {
        if (inPeriod) add(invoiced, d.currency, totals(d).total)
        for (const pm of d.payments) if ((pm.date || '') >= from) add(received, d.currency, Number(pm.amt) || 0)
      }
      if (d.type === 'receipt' && inPeriod) {
        receipts++
        if (!d.fromId) add(received, d.currency, totals(d).total)
      }
    }
    return { made, receipts, invoiced, received }
  }, [data.docs, from])

  const groups = useMemo(() => {
    const s = q.toLowerCase()
    const list = data.docs
      .filter((d) => (d.issueDate || '') >= from)
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
  }, [data.docs, from, type, q])

  const download = async (d: Doc) => {
    setBusy(d.id)
    toast('Preparing your PDF')
    try {
      saveFile(pdfName(d), await makePdf(d, profile))
    } catch {
      toast('Could not make the PDF. Try again.')
    } finally {
      setBusy('')
    }
  }

  const periodName = PERIODS.find((p) => p[0] === period)![1].toLowerCase()

  return (
    <>
      <PageHeader title="Documents" onBack={() => nav('/app')} />
      <main className="wrap">
        <div className="a-pagehead">
          <div>
            <h1>
              Your <em>documents</em>
            </h1>
            <p className="mu">See what you made on any day, and download any invoice, receipt or contract again.</p>
          </div>
        </div>

        <div className="seg a-seg a-period" role="tablist" aria-label="Period">
          {PERIODS.map(([v, l]) => (
            <button key={v} role="tab" aria-selected={period === v} className={period === v ? 'on' : ''} onClick={() => setPeriod(v)}>
              {l}
            </button>
          ))}
        </div>

        <section className="a-sum" aria-label={'Summary for ' + periodName}>
          <div className="dk">
            <span>Money received</span>
            <b className="num">{show(summary.received, profile.currency)}</b>
          </div>
          <div>
            <span>Invoiced</span>
            <b className="num">{show(summary.invoiced, profile.currency)}</b>
          </div>
          <div>
            <span>Documents made</span>
            <b className="num">{summary.made}</b>
          </div>
          <div>
            <span>Receipts given</span>
            <b className="num">{summary.receipts}</b>
          </div>
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
                {g.docs.map((d) => {
                  const st = statusOf(d)
                  const amount = d.type === 'contract' ? (d.fee ? money(d.fee, d.currency) : '') : money(totals(d).total, d.currency)
                  return (
                    <div key={d.id} className="a-docrow">
                      <button className="row" onClick={() => nav(`/app/doc/${d.id}`)}>
                        <span className="l">
                          <span className={'a-dico ' + d.type}>{TYPE_ICON[d.type]}</span>
                          <span>
                            <b>{d.client.name || (d.type === 'contract' && d.title) || 'No client yet'}</b>
                            <span className="mu small">
                              {DOC_LABEL[d.type]} {d.number}
                            </span>
                          </span>
                        </span>
                        <span className="r">
                          {amount && <b>{amount}</b>}
                          <span className={'bd ' + st}>{STATUS_LABEL[st]}</span>
                        </span>
                      </button>
                      <button className="a-dl" onClick={() => download(d)} disabled={busy === d.id} aria-label={`Download ${DOC_LABEL[d.type]} ${d.number} as a PDF`}>
                        <DownloadIcon />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="card empty">
            <b>Nothing {period === 'all' ? 'here yet' : periodName}</b>
            {period === 'all' ? 'Make your first invoice and it will show here.' : 'Try a longer period, or make something new.'}
          </div>
        )}
      </main>
    </>
  )
}
