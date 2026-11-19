import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { Profile } from '../lib/types'
import { CATEGORIES, catOf, defaultContent, fileName, loadContent, saveContent, styleOf, type CardContent, type Category, type Row } from '../lib/studio'
import { cardPdf, cardPng } from '../lib/cardImage'
import { saveFile } from '../lib/pdf'
import { StudioCard } from '../components/StudioCard'
import { PageHeader } from '../components/TopBar'
import { Field, Section, TextArea } from '../components/Fields'
import { DownloadIcon, PlusIcon, TrashIcon } from '../components/Icons'
import { useAuth } from '../data/session'
import { useToast } from '../components/Toast'

/** A design shrunk to the width of the box it sits in. */
function CardFrame({ cat, style, c, profile, className = '' }: { cat: Category; style: string; c: CardContent; profile: Profile; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(0.4)
  useLayoutEffect(() => {
    const fit = () => box.current && setK(box.current.clientWidth / cat.size.w)
    fit()
    const ro = new ResizeObserver(fit)
    if (box.current) ro.observe(box.current)
    return () => ro.disconnect()
  }, [cat.size.w])
  return (
    <div ref={box} className={'sg-frame ' + className} style={{ height: cat.size.h * k }}>
      <div className="sg-in" style={{ transform: `scale(${k})` }}>
        <StudioCard cat={cat.id} style={style} c={c} profile={profile} />
      </div>
    </div>
  )
}

/** What a design shows: what the person typed, or starting words with their own details. Festive designs keep their own greeting until it is changed. */
function contentFor(cat: Category, style: string, saved: CardContent | null, profile: Profile): CardContent {
  const fresh = defaultContent(cat.id, profile, style)
  if (!saved) return fresh
  if (cat.id !== 'festive') return saved
  const titles = cat.styles.map((s) => s.title)
  const messages = cat.styles.map((s) => s.message)
  return {
    ...saved,
    title: titles.includes(saved.title) ? fresh.title : saved.title,
    message: messages.includes(saved.message) ? fresh.message : saved.message,
  }
}

function useUserId(): string {
  const { session } = useAuth()
  return session?.userId || 'me'
}

/* ---------------- The gallery: one tile per category ---------------- */

export function GalleryPage({ profile }: { profile: Profile }) {
  const nav = useNavigate()
  const uid = useUserId()
  return (
    <>
      <PageHeader title="Template gallery" onBack={() => nav('/app')} />
      <main className="wrap">
        <div className="a-pagehead">
          <div>
            <h1>
              Template <em>gallery</em>
            </h1>
            <p className="mu">Price lists, cards, flyers and more, with your name, logo and details already on them. Pick what you want to make, then choose a design.</p>
          </div>
        </div>
        <div className="sg-cats">
          {CATEGORIES.map((cat) => {
            const saved = loadContent(uid, cat.id)
            return (
              <button key={cat.id} className="sg-cat" onClick={() => nav(`/app/templates/${cat.id}`)}>
                <div className="sg-stack" aria-hidden="true">
                  {cat.styles.slice(0, 3).map((s) => (
                    <CardFrame key={s.id} cat={cat} style={s.id} c={contentFor(cat, s.id, saved, profile)} profile={profile} />
                  ))}
                </div>
                <b>{cat.name}</b>
                <small>{cat.use}</small>
                <span className="sg-n">{cat.styles.length} designs</span>
              </button>
            )
          })}
        </div>
        <div className="sg-soon">
          <b>Coming next.</b> New looks for your invoices, receipts and contracts, using your own letterhead, and ready to post content for your page every week.
        </div>
      </main>
    </>
  )
}

/* ---------------- One category: its five designs ---------------- */

export function CategoryPage({ profile }: { profile: Profile }) {
  const nav = useNavigate()
  const uid = useUserId()
  const { cat: catId } = useParams()
  const cat = catOf(catId)
  if (!cat) return <Navigate to="/app/templates" replace />
  const saved = loadContent(uid, cat.id)
  return (
    <>
      <PageHeader title={cat.name} onBack={() => nav('/app/templates')} />
      <main className="wrap">
        <div className="a-pagehead">
          <div>
            <h1>
              Choose a <em>design</em>
            </h1>
            <p className="mu">{cat.lead}</p>
          </div>
        </div>
        <div className="sg-styles">
          {cat.styles.map((s) => (
            <button key={s.id} className="sg-style" onClick={() => nav(`/app/templates/${cat.id}/${s.id}`)}>
              <CardFrame cat={cat} style={s.id} c={contentFor(cat, s.id, saved, profile)} profile={profile} />
              <span>
                <b>{s.name}</b>
                <small>{s.blurb}</small>
              </span>
            </button>
          ))}
        </div>
      </main>
    </>
  )
}

/* ---------------- Making one ---------------- */

function ItemsField({ label, cols, rows, onChange }: { label: string; cols: [string, string, string]; rows: Row[]; onChange: (r: Row[]) => void }) {
  const set = (i: number, k: keyof Row, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  return (
    <div className="f">
      <span>{label}</span>
      <div className="sg-items">
        {rows.map((r, i) => (
          <div key={i} className="sg-item">
            <input value={r.a} placeholder={cols[0]} aria-label={`${cols[0]} ${i + 1}`} onChange={(e) => set(i, 'a', e.target.value)} />
            <input value={r.b} placeholder={cols[1]} aria-label={`${cols[1]} ${i + 1}`} inputMode={cols[1] === 'Price' || cols[1] === 'Quantity' ? 'decimal' : undefined} onChange={(e) => set(i, 'b', e.target.value)} />
            <input value={r.c} placeholder={cols[2]} aria-label={`${cols[2]} ${i + 1}`} onChange={(e) => set(i, 'c', e.target.value)} />
            <button className="x" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`Remove line ${i + 1}`}>
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      {rows.length < 12 && (
        <button className="btn g" style={{ alignSelf: 'flex-start', marginTop: 6 }} onClick={() => onChange([...rows, { a: '', b: '', c: '' }])}>
          <PlusIcon />
          Add a line
        </button>
      )}
    </div>
  )
}

export function MakerPage({ profile }: { profile: Profile }) {
  const nav = useNavigate()
  const toast = useToast()
  const uid = useUserId()
  const { cat: catId, style: styleId } = useParams()
  const cat = catOf(catId)
  const style = cat ? styleOf(cat, styleId) : null
  const [c, setC] = useState<CardContent | null>(() => (cat && style ? contentFor(cat, style.id, loadContent(uid, cat.id), profile) : null))
  const [busy, setBusy] = useState(false)
  const canShare = useMemo(() => {
    try {
      return typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] })
    } catch {
      return false
    }
  }, [])

  // Festive designs carry their own greeting: switching design swaps it unless it was changed.
  const lastStyle = useRef(style?.id)
  useEffect(() => {
    if (!cat || !style || lastStyle.current === style.id) return
    lastStyle.current = style.id
    if (cat.id === 'festive') setC((prev) => (prev ? contentFor(cat, style.id, prev, profile) : prev))
  }, [cat, style, profile])

  useEffect(() => {
    if (cat && c) saveContent(uid, cat.id, c)
  }, [uid, cat, c])

  if (!cat || !style || !c) return <Navigate to="/app/templates" replace />

  const patch = (p: Partial<CardContent>) => setC({ ...c, ...p })

  const run = async (what: 'png' | 'pdf' | 'share') => {
    setBusy(true)
    try {
      const name = fileName(cat, style, profile)
      if (what === 'pdf') {
        saveFile(name + '.pdf', await cardPdf(cat, style.id, c, profile))
      } else {
        const png = await cardPng(cat, style.id, c, profile)
        if (what === 'share') {
          const file = new File([png], name + '.png', { type: 'image/png' })
          try {
            await navigator.share({ files: [file], title: name })
          } catch {
            /* closed the share sheet */
          }
        } else saveFile(name + '.png', png)
      }
      if (what !== 'share') toast('Saved to your downloads')
    } catch {
      toast('Could not make the picture. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    if (!window.confirm('Go back to the starting words? What you typed here will be replaced.')) return
    setC(defaultContent(cat.id, profile, style.id))
  }

  const fields: ReactNode[] = cat.fields.map((f) => {
    if (f.kind === 'items') return <ItemsField key={f.key} label={f.label} cols={f.cols!} rows={c.items} onChange={(items) => patch({ items })} />
    if (f.kind === 'area') return <TextArea key={f.key} label={f.label} value={String(c[f.key] ?? '')} onChange={(v) => patch({ [f.key]: v })} placeholder={f.hint} />
    return <Field key={f.key} label={f.label} value={String(c[f.key] ?? '')} onChange={(v) => patch({ [f.key]: v })} placeholder={f.hint} />
  })

  return (
    <>
      <PageHeader title={cat.name} onBack={() => nav(`/app/templates/${cat.id}`)} />
      <main className="wrap">
        <div className="a-pagehead">
          <div>
            <h1>
              {style.name} <em>{cat.word}</em>
            </h1>
            <p className="mu">Change the words and the design updates as you type. Your name, logo and contact details come from your profile.</p>
          </div>
        </div>
        <div className="sg-chips" role="tablist" aria-label="Designs">
          {cat.styles.map((s) => (
            <button key={s.id} role="tab" aria-selected={s.id === style.id} className={s.id === style.id ? 'on' : ''} onClick={() => nav(`/app/templates/${cat.id}/${s.id}`, { replace: true })}>
              {s.name}
            </button>
          ))}
        </div>
        <div className="sg-maker">
          <div className="sg-form">
            <Section title="Your words">{fields}</Section>
            <button className="btn g" onClick={reset}>
              Start again with the starting words
            </button>
          </div>
          <div className="sg-live">
            <CardFrame cat={cat} style={style.id} c={c} profile={profile} />
            <div className="sg-actions">
              <button className="btn p" onClick={() => run('png')} disabled={busy}>
                <DownloadIcon />
                Download picture
              </button>
              {cat.pdf && (
                <button className="btn" onClick={() => run('pdf')} disabled={busy}>
                  Download PDF
                </button>
              )}
              {canShare && (
                <button className="btn" onClick={() => run('share')} disabled={busy}>
                  Share
                </button>
              )}
            </div>
            <p className="sg-hint">The picture is sharp enough for your WhatsApp status, Instagram and printing. What you type is kept on this device.</p>
          </div>
        </div>
      </main>
    </>
  )
}
