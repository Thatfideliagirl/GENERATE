import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Doc, DocStatus, Profile } from '../lib/types'
import { DOC_LABEL } from '../lib/constants'
import { balanceOf, statusOf, totals } from '../lib/calc'
import { fmtDate, money } from '../lib/format'
import { isoDay } from '../lib/period'

/* ---------------- Stickers: one kind per colour ---------------- */

export type Kind = 'in' | 'billed' | 'due' | 'late' | 'contract'

const KINDS: { k: Kind; name: string; hint: string }[] = [
  { k: 'in', name: 'Money in', hint: 'Payments and receipts' },
  { k: 'billed', name: 'Invoiced', hint: 'Invoices you sent' },
  { k: 'due', name: 'Due', hint: 'Invoices due that day' },
  { k: 'late', name: 'Overdue', hint: 'Due and still unpaid' },
  { k: 'contract', name: 'Contracts', hint: 'Made or signed' },
]

/** Sticker colours people can cycle through: paper colour and ink colour. */
const PALETTE: [string, string][] = [
  ['#cdeed9', '#145c36'],
  ['#d6e6fb', '#1d4f8f'],
  ['#fbe7b0', '#7a5410'],
  ['#f9d0c8', '#9b2c1c'],
  ['#cbedeb', '#135d5a'],
  ['#f6d3e1', '#8f2d55'],
  ['#eadfcb', '#5e4a2c'],
  ['#e3f0b5', '#4f5e12'],
]

const DEFAULT_COLOURS: Record<Kind, number> = { in: 0, billed: 1, due: 2, late: 3, contract: 4 }
const COLOURS_KEY = 'generate.stickers'
const HIDDEN_KEY = 'generate.stickers.hidden'

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}
function writeJSON(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* remembered for this visit only */
  }
}

/** Short money for a sticker: ₦35k, ₦1.2m. */
export function short(n: number, cur: string): string {
  const a = Math.abs(n)
  if (a >= 1e6) return cur + (n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'm'
  if (a >= 1e3) return cur + (n / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'k'
  return cur + Math.round(n)
}

interface Ev {
  kind: Kind
  doc: Doc
  amount: number
  label: string
}

/** Everything that happened, or is due, on each day. */
function eventsByDay(docs: Doc[]): Map<string, Ev[]> {
  const m = new Map<string, Ev[]>()
  const put = (day: string, e: Ev) => {
    if (!day) return
    const list = m.get(day)
    if (list) list.push(e)
    else m.set(day, [e])
  }
  for (const d of docs) {
    if (d.type === 'invoice') {
      const st = statusOf(d)
      if (st !== 'draft') put(d.issueDate, { kind: 'billed', doc: d, amount: totals(d).total, label: `Invoice ${d.number} sent` })
      for (const p of d.payments) put(p.date, { kind: 'in', doc: d, amount: Number(p.amt) || 0, label: `Paid on invoice ${d.number}` })
      if (d.status === 'paid' && !d.payments.length) put(d.issueDate, { kind: 'in', doc: d, amount: totals(d).total, label: `Invoice ${d.number} paid` })
      if ((st === 'sent' || st === 'part') && d.dueDate) put(d.dueDate, { kind: 'due', doc: d, amount: balanceOf(d), label: `Invoice ${d.number} due` })
      if (st === 'overdue' && d.dueDate) put(d.dueDate, { kind: 'late', doc: d, amount: balanceOf(d), label: `Invoice ${d.number} overdue` })
    } else if (d.type === 'receipt') {
      if (!d.fromId) put(d.issueDate, { kind: 'in', doc: d, amount: totals(d).total, label: `Receipt ${d.number}` })
    } else if (d.type === 'contract') {
      put(d.issueDate, { kind: 'contract', doc: d, amount: Number(d.fee) || 0, label: `Contract ${d.number} made` })
      if (d.clientSignedAt) put(isoDay(new Date(d.clientSignedAt)), { kind: 'contract', doc: d, amount: 0, label: `Contract ${d.number} signed` })
    }
  }
  return m
}

/** One sticker per kind of thing on that day, with the total for the main currency. */
function stickersFor(evs: Ev[], hidden: Record<string, boolean>) {
  const out: { kind: Kind; text: string; n: number }[] = []
  for (const { k } of KINDS) {
    if (hidden[k]) continue
    const list = evs.filter((e) => e.kind === k)
    if (!list.length) continue
    const byCur: Record<string, number> = {}
    for (const e of list) byCur[e.doc.currency] = (byCur[e.doc.currency] || 0) + e.amount
    const [cur, sum] = Object.entries(byCur).sort((a, b) => b[1] - a[1])[0]
    const text = k === 'contract' && sum <= 0 ? (list.length > 1 ? `${list.length} contracts` : 'Signed') : (k === 'in' ? '+' : '') + short(sum, cur)
    out.push({ kind: k, text, n: list.length })
  }
  return out
}

const dayMonth = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarView({ docs, profile }: { docs: Doc[]; profile: Profile }) {
  const nav = useNavigate()
  const today = isoDay(new Date())
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [picked, setPicked] = useState<string>(today)
  const [colours, setColours] = useState<Record<Kind, number>>(() => readJSON(COLOURS_KEY, DEFAULT_COLOURS))
  const [hidden, setHidden] = useState<Record<string, boolean>>(() => readJSON(HIDDEN_KEY, {}))
  const events = useMemo(() => eventsByDay(docs), [docs])

  const style = (k: Kind) => {
    const [bg, ink] = PALETTE[colours[k] % PALETTE.length]
    return { background: bg, color: ink }
  }
  const cycle = (k: Kind) => {
    const next = { ...colours, [k]: (colours[k] + 1) % PALETTE.length }
    setColours(next)
    writeJSON(COLOURS_KEY, next)
  }
  const toggle = (k: Kind) => {
    const next = { ...hidden, [k]: !hidden[k] }
    setHidden(next)
    writeJSON(HIDDEN_KEY, next)
  }

  const cells = useMemo(() => {
    const first = new Date(month)
    first.setDate(1 - ((month.getDay() + 6) % 7))
    const list: { day: string; date: Date; inMonth: boolean }[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(first)
      d.setDate(first.getDate() + i)
      list.push({ day: isoDay(d), date: d, inMonth: d.getMonth() === month.getMonth() })
    }
    // drop a last row that is fully in the next month
    return list.slice(35).every((c) => !c.inMonth) ? list.slice(0, 35) : list
  }, [month])

  const monthKey = isoDay(month).slice(0, 7)
  const sums = useMemo(() => {
    const r: Record<Kind, Record<string, number>> = { in: {}, billed: {}, due: {}, late: {}, contract: {} }
    for (const [day, evs] of events) {
      if (!day.startsWith(monthKey)) continue
      for (const e of evs) r[e.kind][e.doc.currency] = (r[e.kind][e.doc.currency] || 0) + e.amount
    }
    return r
  }, [events, monthKey])
  const showSum = (m: Record<string, number>) => {
    const e = Object.entries(m).filter(([, v]) => v > 0)
    return e.length ? e.map(([c, v]) => money(v, c)).join(' · ') : money(0, profile.currency)
  }

  const go = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1))
  const title = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const dayEvents = (events.get(picked) || []).filter((e) => !hidden[e.kind])

  return (
    <section className="a-cal" aria-label="Calendar">
      <div className="a-calhead">
        <h2>
          {title.split(' ')[0]} <em>{title.split(' ')[1]}</em>
        </h2>
        <div className="a-calnav">
          <button onClick={() => go(-1)} aria-label="Previous month">
            ‹
          </button>
          <button
            className="today"
            onClick={() => {
              const d = new Date()
              setMonth(new Date(d.getFullYear(), d.getMonth(), 1))
              setPicked(today)
            }}
          >
            Today
          </button>
          <button onClick={() => go(1)} aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      <div className="a-calsum">
        <div>
          <span>Money in</span>
          <b className="num">{showSum(sums.in)}</b>
        </div>
        <div>
          <span>Invoiced</span>
          <b className="num">{showSum(sums.billed)}</b>
        </div>
        <div>
          <span>Due this month</span>
          <b className="num">{showSum({ ...sums.due })}</b>
        </div>
      </div>

      <div className="a-callegend" aria-label="Sticker colours">
        {KINDS.map(({ k, name, hint }) => (
          <span key={k} className={'a-leg' + (hidden[k] ? ' off' : '')}>
            <button className="a-legsw" style={style(k)} onClick={() => cycle(k)} title="Change the colour" aria-label={`Change the colour for ${name}`} />
            <button className="a-legname" onClick={() => toggle(k)} title={hidden[k] ? 'Show these stickers' : 'Hide these stickers'} aria-pressed={!hidden[k]}>
              {name}
              <small>{hint}</small>
            </button>
          </span>
        ))}
      </div>

      <p className="a-caltip">Tap a colour to change it. Tap a name to hide or show those stickers.</p>

      <div className="a-calgrid" role="grid" aria-label={title}>
        {WEEKDAYS.map((w) => (
          <div key={w} className="a-calwd" role="columnheader">
            {w}
          </div>
        ))}
        {cells.map(({ day, date, inMonth }, i) => {
          const st = stickersFor(events.get(day) || [], hidden)
          const cls = ['a-day', inMonth ? '' : 'out', day === today ? 'now' : '', day === picked ? 'on' : ''].filter(Boolean).join(' ')
          return (
            <button key={day} className={cls} onClick={() => setPicked(day)} aria-label={`${fmtDate(day)}${st.length ? ', ' + st.map((x) => x.text).join(', ') : ''}`}>
              <span className="a-dnum">{date.getDate()}</span>
              <span className="a-stickers">
                {st.slice(0, 3).map((x, j) => (
                  <span key={x.kind} className="a-stk" style={{ ...style(x.kind), transform: `rotate(${((i * 7 + j * 5) % 7) - 3}deg)` }}>
                    {x.text}
                  </span>
                ))}
                {st.length > 3 && <span className="a-stkmore">+{st.length - 3}</span>}
              </span>
              <span className="a-dots" aria-hidden="true">
                {st.map((x) => (
                  <i key={x.kind} style={{ background: style(x.kind).color }} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="card a-calday">
        <div className="a-head" style={{ margin: '0 0 8px' }}>
          <h2>{picked === today ? 'Today' : fmtDate(picked)}</h2>
        </div>
        {dayEvents.length ? (
          dayEvents.map((e, i) => (
            <button key={i} className="a-calrow" onClick={() => nav(`/app/doc/${e.doc.id}`)}>
              <span className="a-stk" style={style(e.kind)}>
                {KINDS.find((x) => x.k === e.kind)!.name}
              </span>
              <span className="a-calrowt">
                <b>{e.doc.client.name || DOC_LABEL[e.doc.type]}</b>
                <small>{e.label}</small>
              </span>
              {e.amount > 0 && <b className="num">{money(e.amount, e.doc.currency)}</b>}
            </button>
          ))
        ) : (
          <p className="mu small" style={{ margin: 0 }}>
            Nothing on this day. Tap a day with stickers to see what happened.
          </p>
        )}
      </div>
    </section>
  )
}

/* ---------------- Board: every invoice in a column by where it stands ---------------- */

const INVOICE_COLS: { st: DocStatus; name: string }[] = [
  { st: 'draft', name: 'Drafts' },
  { st: 'sent', name: 'Waiting' },
  { st: 'part', name: 'Part paid' },
  { st: 'overdue', name: 'Overdue' },
  { st: 'paid', name: 'Paid' },
]
const CONTRACT_COLS: { st: DocStatus; name: string }[] = [
  { st: 'draft', name: 'Drafts' },
  { st: 'sent', name: 'Sent to sign' },
  { st: 'signed', name: 'Signed' },
]

export function BoardView({ docs }: { docs: Doc[] }) {
  const nav = useNavigate()
  const [what, setWhat] = useState<'invoice' | 'contract'>('invoice')
  const cols = what === 'invoice' ? INVOICE_COLS : CONTRACT_COLS
  const list = docs.filter((d) => d.type === what).sort((a, b) => b.updatedAt - a.updatedAt)
  return (
    <section className="a-board" aria-label="Board">
      <div className="seg a-boardsw">
        <button className={what === 'invoice' ? 'on' : ''} onClick={() => setWhat('invoice')}>
          Invoices
        </button>
        <button className={what === 'contract' ? 'on' : ''} onClick={() => setWhat('contract')}>
          Contracts
        </button>
      </div>
      <div className="a-cols" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(180px, 1fr))` }}>
        {cols.map((c) => {
          const items = list.filter((d) => statusOf(d) === c.st)
          const byCur: Record<string, number> = {}
          for (const d of items) {
            const v = what === 'contract' ? Number(d.fee) || 0 : c.st === 'paid' ? totals(d).total : balanceOf(d)
            byCur[d.currency] = (byCur[d.currency] || 0) + v
          }
          const sum = Object.entries(byCur)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => short(v, k))
            .join(' · ')
          return (
            <div key={c.st} className={'a-col ' + c.st}>
              <div className="a-colh">
                <span className={'bd ' + c.st}>{c.name}</span>
                <span className="a-coln">{items.length}</span>
                {sum && <b className="num">{sum}</b>}
              </div>
              <div className="a-colbody">
                {items.length ? (
                  items.map((d) => (
                    <button key={d.id} className="a-bcard" onClick={() => nav(`/app/doc/${d.id}`)}>
                      <b>{d.client.name || 'No client name'}</b>
                      <span className="mu small">
                        {DOC_LABEL[d.type]} {d.number}
                        {d.type === 'invoice' && d.dueDate && c.st !== 'paid' ? ` · due ${dayMonth(d.dueDate)}` : ''}
                      </span>
                      <span className="num a-bamt">{what === 'contract' ? (d.fee ? money(d.fee, d.currency) : '') : money(c.st === 'paid' ? totals(d).total : balanceOf(d), d.currency)}</span>
                    </button>
                  ))
                ) : (
                  <p className="a-colempty">Nothing here</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ---------------- The switch between views ---------------- */

export type HomeView = 'overview' | 'week' | 'calendar' | 'board'
const VIEW_KEY = 'generate.homeview'

export function readView(): HomeView {
  try {
    const v = localStorage.getItem(VIEW_KEY)
    return v === 'calendar' || v === 'board' || v === 'week' ? v : 'overview'
  } catch {
    return 'overview'
  }
}

export function ViewSwitch({ value, onChange }: { value: HomeView; onChange: (v: HomeView) => void }) {
  const pick = (v: HomeView) => {
    onChange(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* remembered for this visit only */
    }
  }
  const opts: [HomeView, string, JSX.Element][] = [
    [
      'overview',
      'Overview',
      <svg key="o" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
        <path d="M4 20v-4M9 20v-6M14 20v-3M19 20v-7" />
      </svg>,
    ],
    [
      'week',
      'Week ahead',
      <svg key="w" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m4 6.5 1.6 1.6L8.5 5M4 12.5l1.6 1.6 2.9-3.1M4 18.5l1.6 1.6 2.9-3.1" />
        <path d="M11.5 7h8.5M11.5 13h8.5M11.5 19h8.5" />
      </svg>,
    ],
    [
      'calendar',
      'Calendar',
      <svg key="c" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
        <rect x="13" y="13.5" width="4" height="3.5" rx="1" />
      </svg>,
    ],
    [
      'board',
      'Board',
      <svg key="b" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="4" width="5" height="16" rx="1.6" />
        <rect x="9.5" y="4" width="5" height="11" rx="1.6" />
        <rect x="15.5" y="4" width="5" height="7" rx="1.6" />
      </svg>,
    ],
  ]
  return (
    <div className="a-views" role="tablist" aria-label="How to see Home">
      {opts.map(([v, l, icon]) => (
        <button key={v} role="tab" aria-selected={value === v} className={value === v ? 'on' : ''} onClick={() => pick(v)}>
          {icon}
          {l}
        </button>
      ))}
    </div>
  )
}

/* ---------------- This week: what needs doing, day by day ---------------- */

const DAY_MS = 86400000

function addDaysIso(iso: string, n: number): string {
  return isoDay(new Date(new Date(iso + 'T12:00:00').getTime() + n * DAY_MS))
}

function dayName(iso: string, today: string): string {
  if (iso === today) return 'Today'
  if (iso === addDaysIso(today, 1)) return 'Tomorrow'
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

export function WeekView({ docs, profile, onRemind }: { docs: Doc[]; profile: Profile; onRemind: (d: Doc) => void }) {
  const nav = useNavigate()
  const today = isoDay(new Date())
  const end = addDaysIso(today, 6)
  const weekStart = addDaysIso(today, -((new Date().getDay() + 6) % 7))

  const w = useMemo(() => {
    const overdue: Doc[] = []
    const drafts: Doc[] = []
    const unsigned: Doc[] = []
    const comments: Doc[] = []
    const days = new Map<string, Doc[]>()
    const expected: Record<string, number> = {}
    const received: Record<string, number> = {}
    for (const d of docs) {
      const st = statusOf(d)
      if (d.type === 'invoice') {
        if (st === 'overdue') overdue.push(d)
        if ((st === 'sent' || st === 'part') && d.dueDate >= today && d.dueDate <= end) {
          const list = days.get(d.dueDate) || []
          list.push(d)
          days.set(d.dueDate, list)
          expected[d.currency] = (expected[d.currency] || 0) + balanceOf(d)
        }
        for (const p of d.payments) if (p.date >= weekStart && p.date <= today) received[d.currency] = (received[d.currency] || 0) + (Number(p.amt) || 0)
      }
      if (d.type === 'receipt' && !d.fromId && d.issueDate >= weekStart && d.issueDate <= today) received[d.currency] = (received[d.currency] || 0) + totals(d).total
      if (st === 'draft' && d.type !== 'receipt') drafts.push(d)
      if (d.type === 'contract' && st === 'sent') (d.clientComment ? comments : unsigned).push(d)
    }
    overdue.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    drafts.sort((a, b) => a.updatedAt - b.updatedAt)
    return { overdue, drafts, unsigned, comments, days, expected, received }
  }, [docs, today, end, weekStart])

  const sum = (m: Record<string, number>) => {
    const e = Object.entries(m).filter(([, v]) => v > 0)
    return e.length ? e.map(([c, v]) => money(v, c)).join(' · ') : money(0, profile.currency)
  }
  const todo = w.overdue.length + w.drafts.length + w.unsigned.length + w.comments.length
  const ago = (t: number) => {
    if (!t || t < 1e11) return 'a while ago'
    const n = Math.floor((Date.now() - t) / DAY_MS)
    return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`
  }
  const lateBy = (iso: string) => {
    const n = Math.round((new Date(today + 'T12:00:00').getTime() - new Date(iso + 'T12:00:00').getTime()) / DAY_MS)
    return n === 1 ? '1 day late' : `${n} days late`
  }

  const nextDays = Array.from({ length: 7 }, (_, i) => addDaysIso(today, i))

  return (
    <section className="a-week" aria-label="Week ahead">
      <div className="a-calsum">
        <div>
          <span>Coming in the next 7 days</span>
          <b className="num">{sum(w.expected)}</b>
        </div>
        <div>
          <span>Received this week</span>
          <b className="num">{sum(w.received)}</b>
        </div>
        <div>
          <span>Things to do</span>
          <b className="num">{todo}</b>
        </div>
      </div>

      <div className="a-cols2">
        <div>
          <div className="a-head">
            <h2>
              Needs you <em>now</em>
            </h2>
          </div>
          <div className="card a-todo">
            {todo === 0 && (
              <div className="empty a-calm">
                <b>You are all caught up</b>
                Nothing is late and nothing is waiting on you. Enjoy your week.
              </div>
            )}
            {w.overdue.map((d) => (
              <div key={d.id} className="a-task late">
                <span className="a-tdot" />
                <button className="a-tbody" onClick={() => nav(`/app/doc/${d.id}`)}>
                  <b>{d.client.name || 'No client name'} has not paid</b>
                  <small>
                    Invoice {d.number} · {money(balanceOf(d), d.currency)} · {lateBy(d.dueDate)}
                  </small>
                </button>
                <button className="a-tbtn" onClick={() => onRemind(d)}>
                  Remind
                </button>
              </div>
            ))}
            {w.comments.map((d) => (
              <div key={d.id} className="a-task ask">
                <span className="a-tdot" />
                <button className="a-tbody" onClick={() => nav(`/app/doc/${d.id}`)}>
                  <b>{d.clientComment?.name || d.client.name || 'Your client'} asked for a change</b>
                  <small>Contract {d.number}: "{d.clientComment?.text}"</small>
                </button>
                <button className="a-tbtn" onClick={() => nav(`/app/doc/${d.id}`)}>
                  Open
                </button>
              </div>
            ))}
            {w.unsigned.map((d) => (
              <div key={d.id} className="a-task">
                <span className="a-tdot" />
                <button className="a-tbody" onClick={() => nav(`/app/doc/${d.id}`)}>
                  <b>Waiting for {d.client.name || 'your client'} to sign</b>
                  <small>
                    Contract {d.number} · sent {ago(d.updatedAt)}
                  </small>
                </button>
                <button className="a-tbtn" onClick={() => nav(`/app/doc/${d.id}`)}>
                  Open
                </button>
              </div>
            ))}
            {w.drafts.map((d) => (
              <div key={d.id} className="a-task draft">
                <span className="a-tdot" />
                <button className="a-tbody" onClick={() => nav(`/app/doc/${d.id}`)}>
                  <b>Finish and send {DOC_LABEL[d.type].toLowerCase()} {d.number}</b>
                  <small>
                    {d.client.name ? `For ${d.client.name} · ` : ''}started {ago(d.updatedAt)}
                  </small>
                </button>
                <button className="a-tbtn" onClick={() => nav(`/app/doc/${d.id}`)}>
                  Finish
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="a-head">
            <h2>
              The next <em>7 days</em>
            </h2>
          </div>
          <div className="card a-days">
            {nextDays.map((day) => {
              const due = w.days.get(day) || []
              return (
                <div key={day} className={'a-wday' + (day === today ? ' now' : '') + (due.length ? '' : ' quiet')}>
                  <div className="a-wdh">
                    <b>{dayName(day, today)}</b>
                    {!due.length && <small>Nothing due</small>}
                  </div>
                  {due.map((d) => (
                    <div key={d.id} className="a-task">
                      <span className="a-tdot due" />
                      <button className="a-tbody" onClick={() => nav(`/app/doc/${d.id}`)}>
                        <b>{d.client.name || 'No client name'} should pay</b>
                        <small>
                          Invoice {d.number} · {money(balanceOf(d), d.currency)}
                        </small>
                      </button>
                      <button className="a-tbtn" onClick={() => onRemind(d)}>
                        Remind
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
