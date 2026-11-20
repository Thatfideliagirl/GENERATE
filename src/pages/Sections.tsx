import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Doc, DocStatus, DocType, Profile } from '../lib/types'
import { balanceOf, paidOf, statusOf, totals } from '../lib/calc'
import { money } from '../lib/format'
import { startOf, periodName, type Period } from '../lib/period'
import { getSignedFile, deleteSigned } from '../lib/signedStore'
import { saveFile } from '../lib/pdf'
import { PageHeader } from '../components/TopBar'
import { PeriodTabs } from '../components/PeriodTabs'
import { DocRow } from '../components/DocRow'
import { useSigned } from '../components/useSigned'
import { DownloadIcon, PenIcon, PlusIcon, TrashIcon } from '../components/Icons'
import { useStore } from '../data/store'
import { useToast } from '../components/Toast'

type Stat = { k: string; v: string; dark?: boolean; tone?: 'bad' }

const add = (m: Record<string, number>, c: string, v: number) => {
  if (v > 0) m[c] = (m[c] || 0) + v
}
const show = (m: Record<string, number>, fallback: string) => {
  const e = Object.entries(m)
  return e.length ? e.map(([k, v]) => money(v, k)).join(' · ') : money(0, fallback)
}

const SETUP: Record<DocType, { title: string; word: string; lead: string; newLabel: string; newTo: string; filters: [DocStatus | 'all', string][] }> = {
  invoice: {
    title: 'Invoices',
    word: 'invoices',
    lead: 'Every invoice you have sent, what has been paid and what is still waiting.',
    newLabel: 'New invoice',
    newTo: '/app/new/invoice',
    filters: [
      ['all', 'All'],
      ['sent', 'Unpaid'],
      ['part', 'Part paid'],
      ['overdue', 'Overdue'],
      ['paid', 'Paid'],
      ['draft', 'Drafts'],
    ],
  },
  receipt: {
    title: 'Receipts',
    word: 'receipts',
    lead: 'Every receipt you have issued, ready to send or download again.',
    newLabel: 'New receipt',
    newTo: '/app/new/receipt',
    filters: [],
  },
  contract: {
    title: 'Contracts',
    word: 'contracts',
    lead: 'Your agreements, from drafts to signed.',
    newLabel: 'New contract',
    newTo: '/app/contract',
    filters: [
      ['all', 'All'],
      ['draft', 'Drafts'],
      ['sent', 'Sent'],
      ['signed', 'Signed'],
    ],
  },
}

function stats(type: DocType, docs: Doc[], from: string, currency: string): Stat[] {
  const list = docs.filter((d) => d.type === type && (d.issueDate || '') >= from)
  if (type === 'invoice') {
    const invoiced: Record<string, number> = {}
    const paid: Record<string, number> = {}
    const pending: Record<string, number> = {}
    let overdue = 0
    for (const d of list) {
      const st = statusOf(d)
      add(invoiced, d.currency, totals(d).total)
      add(paid, d.currency, st === 'paid' ? totals(d).total : paidOf(d))
      if (st === 'sent' || st === 'part' || st === 'overdue') add(pending, d.currency, balanceOf(d))
      if (st === 'overdue') overdue++
    }
    return [
      { k: 'Invoiced', v: show(invoiced, currency), dark: true },
      { k: 'Paid', v: show(paid, currency) },
      { k: 'Still to be paid', v: show(pending, currency) },
      { k: 'Overdue', v: String(overdue), tone: overdue ? 'bad' : undefined },
    ]
  }
  if (type === 'receipt') {
    const total: Record<string, number> = {}
    let fromInvoices = 0
    for (const d of list) {
      add(total, d.currency, totals(d).total)
      if (d.fromId) fromInvoices++
    }
    return [
      { k: 'Receipts issued', v: String(list.length), dark: true },
      { k: 'Amount on receipts', v: show(total, currency) },
      { k: 'From invoices', v: String(fromInvoices) },
      { k: 'On their own', v: String(list.length - fromInvoices) },
    ]
  }
  const count = (s: DocStatus) => list.filter((d) => statusOf(d) === s).length
  return [
    { k: 'Contracts', v: String(list.length), dark: true },
    { k: 'Signed', v: String(count('signed')) },
    { k: 'Sent', v: String(count('sent')) },
    { k: 'Drafts', v: String(count('draft')) },
  ]
}

/** One kind of document: its own summary for the chosen time, filters, and the list. */
export function DocSection({ profile, type }: { profile: Profile; type: DocType }) {
  const nav = useNavigate()
  const { data } = useStore()
  const cfg = SETUP[type]
  const [period, setPeriod] = useState<Period>('all')
  const [status, setStatus] = useState<DocStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const from = startOf(period)

  const summary = useMemo(() => stats(type, data.docs, from, profile.currency), [type, data.docs, from, profile.currency])
  const list = useMemo(() => {
    const s = q.toLowerCase()
    return data.docs
      .filter((d) => d.type === type && (d.issueDate || '') >= from)
      .filter((d) => status === 'all' || statusOf(d) === status)
      .filter((d) => !s || `${d.client.name} ${d.number} ${d.title ?? ''}`.toLowerCase().includes(s))
      .sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || '') || b.updatedAt - a.updatedAt)
  }, [data.docs, type, from, status, q])

  return (
    <>
      <PageHeader title={cfg.title} onBack={() => nav('/app')} />
      <main className="wrap">
        <div className="a-pagehead">
          <div>
            <h1>
              Your <em>{cfg.word}</em>
            </h1>
            <p className="mu">{cfg.lead}</p>
          </div>
          <button className="btn p" onClick={() => nav(cfg.newTo)}>
            <PlusIcon />
            {cfg.newLabel}
          </button>
        </div>
        <PeriodTabs value={period} onChange={setPeriod} />
        <section className="a-sum" aria-label={`${cfg.title} summary, ${periodName(period)}`}>
          {summary.map((x) => (
            <div key={x.k} className={(x.dark ? 'dk ' : '') + (x.tone ?? '')}>
              <span>{x.k}</span>
              <b className="num">{x.v}</b>
            </div>
          ))}
        </section>
        <div className="a-filter">
          <input type="search" placeholder="Search by client or number" aria-label={'Search your ' + cfg.word} value={q} onChange={(e) => setQ(e.target.value)} />
          {cfg.filters.length > 0 && (
            <div className="seg a-seg" role="tablist" aria-label="Status">
              {cfg.filters.map(([v, l]) => (
                <button key={v} role="tab" aria-selected={status === v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="card a-list">
          {list.length ? (
            list.map((d) => <DocRow key={d.id} d={d} profile={profile} />)
          ) : (
            <div className="empty">
              <b>No {cfg.word} here yet</b>
              {data.docs.some((d) => d.type === type) ? 'Try another time or filter.' : `Make your first one and it will show here.`}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

const kb = (n: number) => (n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB')

/** Documents signed with Generate, kept on this device so they can be downloaded again. */
export function SignedDocs() {
  const nav = useNavigate()
  const toast = useToast()
  const { signed, reload } = useSigned()
  const [period, setPeriod] = useState<Period>('all')
  const [armed, setArmed] = useState('')
  const from = startOf(period)
  const list = signed.filter((r) => new Date(r.createdAt).toISOString().slice(0, 10) >= from)

  const get = async (id: string, name: string) => {
    const b = await getSignedFile(id).catch(() => null)
    if (b) saveFile(`${name} signed.pdf`, b)
    else toast('That file is no longer on this device')
  }
  const remove = async (id: string) => {
    if (armed !== id) {
      setArmed(id)
      window.setTimeout(() => setArmed(''), 3500)
      return
    }
    await deleteSigned(id).catch(() => undefined)
    reload()
    toast('Removed from this device')
  }

  return (
    <>
      <PageHeader title="Signed documents" onBack={() => nav('/app')} />
      <main className="wrap">
        <div className="a-pagehead">
          <div>
            <h1>
              Signed <em>documents</em>
            </h1>
            <p className="mu">Every PDF or photo you signed with Generate. They are kept on this phone or laptop, ready to download again.</p>
          </div>
          <button className="btn p" onClick={() => nav('/app/sign')}>
            <PenIcon />
            Sign a document
          </button>
        </div>
        <PeriodTabs value={period} onChange={setPeriod} />
        <section className="a-sum" aria-label="Signed documents summary">
          <div className="dk">
            <span>Signed {period === 'all' ? 'so far' : periodName(period)}</span>
            <b className="num">{list.length}</b>
          </div>
          <div>
            <span>Pages signed</span>
            <b className="num">{list.reduce((a, r) => a + r.pages, 0)}</b>
          </div>
        </section>
        <div className="card a-list">
          {list.length ? (
            list.map((r) => (
              <div key={r.id} className="a-docrow">
                <div className="row a-static">
                  <span className="l">
                    <span className="a-dico signed">
                      <PenIcon />
                    </span>
                    <span>
                      <b>{r.name}</b>
                      <span className="mu small">
                        {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {r.pages} {r.pages === 1 ? 'page' : 'pages'} · {kb(r.size)}
                      </span>
                    </span>
                  </span>
                  <span className="r">
                    <span className="bd signed">Signed</span>
                  </span>
                </div>
                <button className="a-dl" onClick={() => remove(r.id)} aria-label={'Remove ' + r.name}>
                  {armed === r.id ? <span className="a-sure">Sure?</span> : <TrashIcon />}
                </button>
                <button className="a-dl" onClick={() => get(r.id, r.name)} aria-label={'Download ' + r.name}>
                  <DownloadIcon />
                </button>
              </div>
            ))
          ) : (
            <div className="empty">
              <b>Nothing signed {period === 'all' ? 'yet' : periodName(period)}</b>Sign a PDF or a photo of a document and it will be kept here.
            </div>
          )}
        </div>
      </main>
    </>
  )
}
