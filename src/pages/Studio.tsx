import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { Profile } from '../lib/types'
import { CARD_FONTS, CATEGORIES, DEFAULT_OPTIONS, catOf, defaultContent, fileName, loadContent, optionsOf, saveContent, styleOf, type Align, type CardContent, type CardOptions, type Category, type PicShape, type Row } from '../lib/studio'
import { readImage, readPhoto } from '../lib/image'
import { socialLines } from '../lib/social'
import { cardPdf, cardPng } from '../lib/cardImage'
import { saveFile } from '../lib/pdf'
import { StudioCard, fitCard } from '../components/StudioCard'
import { PageHeader } from '../components/TopBar'
import { Field, Section } from '../components/Fields'
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
  const inner = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = inner.current?.firstElementChild as HTMLElement | null
    if (el) fitCard(el)
  })
  return (
    <div ref={box} className={'gl-frame ' + className} style={{ height: cat.size.h * k }}>
      <div ref={inner} className="gl-in" style={{ transform: `scale(${k})` }}>
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
        <div className="gl-cats">
          {CATEGORIES.map((cat) => {
            const saved = loadContent(uid, cat.id)
            return (
              <button key={cat.id} className="gl-cat" onClick={() => nav(`/app/templates/${cat.id}`)}>
                <div className="gl-stack" aria-hidden="true">
                  {cat.styles.slice(0, 3).map((s) => (
                    <CardFrame key={s.id} cat={cat} style={s.id} c={contentFor(cat, s.id, saved, profile)} profile={profile} />
                  ))}
                </div>
                <b>{cat.name}</b>
                <small>{cat.use}</small>
                <span className="gl-n">{cat.styles.length} designs</span>
              </button>
            )
          })}
        </div>
        <div className="gl-soon">
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
        <div className="gl-styles">
          {cat.styles.map((s) => (
            <button key={s.id} className="gl-style" onClick={() => nav(`/app/templates/${cat.id}/${s.id}`)}>
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

const MAIN_COLOURS = ['#13203a', '#b4603f', '#1f7a54', '#1f5f8b', '#b8475f', '#b8862b', '#6b4a2f', '#16181d']
const BG_COLOURS = ['#ffffff', '#fbf6ea', '#f7e4dc', '#e3f1ea', '#e6edf3', '#efe4d2', '#13203a', '#16181d']

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function Tick({ label, hint, on, set, disabled }: { label: string; hint?: string; on: boolean; set: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={'gl-tick' + (disabled ? ' off' : '')}>
      <input type="checkbox" checked={on} disabled={disabled} onChange={(e) => set(e.target.checked)} />
      <span>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
    </label>
  )
}

function Swatches({ label, value, colours, onChange }: { label: string; value: string; colours: string[]; onChange: (v: string) => void }) {
  return (
    <div className="f">
      <span>{label}</span>
      <div className="gl-sw">
        <button className={'gl-dot own' + (value ? '' : ' on')} onClick={() => onChange('')} title="The design's own" aria-label="The design's own colour">
          ✕
        </button>
        {colours.map((col) => (
          <button key={col} className={'gl-dot' + (value.toLowerCase() === col ? ' on' : '')} style={{ background: col }} onClick={() => onChange(col)} aria-label={col} />
        ))}
        <label className="gl-dot pick" title="Any colour">
          <input type="color" value={value || '#13203a'} onChange={(e) => onChange(e.target.value)} aria-label={`${label}, any colour`} />
        </label>
      </div>
    </div>
  )
}

function Slider({ label, value, min, max, step, show, onChange }: { label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void }) {
  return (
    <label className="f gl-range">
      <span>
        {label} <b>{show}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="f">
      <span>{label}</span>
      <div className="seg gl-seg">
        {options.map(([v, l]) => (
          <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

function Upload({ label, onFile }: { label: string; onFile: (f: File) => void }) {
  return (
    <label className="btn gl-up">
      <PlusIcon />
      {label}
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </label>
  )
}

const BULLET = /^\s*[•\-*]\s+/
const NUMBER = /^\s*\d+[.)]\s+/
const stripMark = (l: string) => l.replace(/^\s*([•\-*]|\d+[.)])\s+/, '')

/** A text box with buttons for bullet points, numbered lines and highlighting. */
function FormatArea({ label, value, hint, onChange }: { label: string; value: string; hint?: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const list = (kind: 'bullet' | 'number') => {
    const el = ref.current
    const a = el ? el.selectionStart : value.length
    const b = el ? el.selectionEnd : value.length
    const start = value.lastIndexOf('\n', a - 1) + 1
    const endAt = value.indexOf('\n', b)
    const end = endAt < 0 ? value.length : endAt
    const lines = value.slice(start, end).split('\n')
    const test = kind === 'bullet' ? BULLET : NUMBER
    const all = lines.every((l) => test.test(l))
    const out = lines.map((l, i) => (all ? stripMark(l) : (kind === 'bullet' ? '• ' : `${i + 1}. `) + stripMark(l)))
    onChange(value.slice(0, start) + out.join('\n') + value.slice(end))
    el?.focus()
  }
  const mark = () => {
    const el = ref.current
    const a = el ? el.selectionStart : value.length
    const b = el ? el.selectionEnd : value.length
    const picked = value.slice(a, b)
    if (/^==.*==$/.test(picked)) onChange(value.slice(0, a) + picked.slice(2, -2) + value.slice(b))
    else onChange(value.slice(0, a) + '==' + (picked || 'your words') + '==' + value.slice(b))
    el?.focus()
  }
  return (
    <label className="f">
      <span>{label}</span>
      <div className="gl-fmt" role="toolbar" aria-label={`Format ${label}`}>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => list('bullet')}>
          • Bullets
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => list('number')}>
          1. Numbers
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={mark}>
          <mark>Highlight</mark>
        </button>
      </div>
      <textarea ref={ref} rows={4} value={value} placeholder={hint} onChange={(e) => onChange(e.target.value)} />
      <small className="gl-tip">Select some words, then tap Highlight. Bullets and numbers work on the line you are on.</small>
    </label>
  )
}

function ItemsField({ label, cols, rows, onChange }: { label: string; cols: [string, string, string]; rows: Row[]; onChange: (r: Row[]) => void }) {
  const set = (i: number, p: Partial<Row>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)))
  const move = (i: number, by: number) => {
    const j = i + by
    if (j < 0 || j >= rows.length) return
    const next = rows.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div className="f">
      <span>{label}</span>
      <div className="gl-items">
        {rows.map((r, i) => (
          <div key={i} className={'gl-item' + (r.h ? ' hl' : '')}>
            <input className="a" value={r.a} placeholder={cols[0]} aria-label={`${cols[0]} ${i + 1}`} onChange={(e) => set(i, { a: e.target.value })} />
            <input className="b" value={r.b} placeholder={cols[1]} aria-label={`${cols[1]} ${i + 1}`} inputMode={cols[1] === 'Price' || cols[1] === 'Quantity' ? 'decimal' : undefined} onChange={(e) => set(i, { b: e.target.value })} />
            <input className="c" value={r.c} placeholder={cols[2]} aria-label={`${cols[2]} ${i + 1}`} onChange={(e) => set(i, { c: e.target.value })} />
            <div className="gl-acts">
              <button className={r.h ? 'on' : ''} onClick={() => set(i, { h: !r.h })} title="Highlight this line" aria-label={`Highlight line ${i + 1}`} aria-pressed={!!r.h}>
                ★
              </button>
              <button onClick={() => move(i, -1)} disabled={i === 0} title="Move up" aria-label={`Move line ${i + 1} up`}>
                ↑
              </button>
              <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} title="Move down" aria-label={`Move line ${i + 1} down`}>
                ↓
              </button>
              <button className="del" onClick={() => onChange(rows.filter((_, j) => j !== i))} title="Remove" aria-label={`Remove line ${i + 1}`}>
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
      {rows.length < 12 ? (
        <button className="btn gl-add" onClick={() => onChange([...rows, { a: '', b: '', c: '' }])}>
          <PlusIcon />
          Add a line
        </button>
      ) : (
        <small className="gl-tip">Twelve lines is the most that fits nicely on one card.</small>
      )}
    </div>
  )
}

type Tab = 'words' | 'show' | 'style' | 'pic'

export function MakerPage({ profile }: { profile: Profile }) {
  const nav = useNavigate()
  const toast = useToast()
  const uid = useUserId()
  const { cat: catId, style: styleId } = useParams()
  const cat = catOf(catId)
  const style = cat ? styleOf(cat, styleId) : null
  const [c, setC] = useState<CardContent | null>(() => (cat && style ? contentFor(cat, style.id, loadContent(uid, cat.id), profile) : null))
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<Tab>('words')
  const live = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number; w: number; h: number } | null>(null)
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

  // Saved a moment after typing stops, so dragging a picture stays smooth.
  useEffect(() => {
    if (!cat || !c) return
    const t = setTimeout(() => saveContent(uid, cat.id, c), 400)
    return () => clearTimeout(t)
  }, [uid, cat, c])

  if (!cat || !style || !c) return <Navigate to="/app/templates" replace />

  const o = optionsOf(c)
  const patch = (p: Partial<CardContent>) => setC((prev) => (prev ? { ...prev, ...p } : prev))
  const setO = (p: Partial<CardOptions>) => setC((prev) => (prev ? { ...prev, o: { ...(prev.o || {}), ...p } } : prev))

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
    setC({ ...defaultContent(cat.id, profile, style.id), o: c.o })
  }

  const resetStyle = () =>
    setO({ align: '', color: '', bg: '', bgImage: '', bgOpacity: DEFAULT_OPTIONS.bgOpacity, headFont: '', textFont: '', headSize: 1, textSize: 1 })

  const photo = async (f: File, then: (url: string, aspect: number) => void) => {
    try {
      const { url, aspect } = await readPhoto(f, 1000)
      then(url, aspect)
    } catch {
      toast('That file is not a picture we can use')
    }
  }

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest('.st-pic') || !live.current) return
    const r = live.current.getBoundingClientRect()
    drag.current = { x: e.clientX, y: e.clientY, px: o.picX, py: o.picY, w: r.width, h: r.height }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    setO({ picX: clamp(d.px + (e.clientX - d.x) / d.w, -0.3, 0.95), picY: clamp(d.py + (e.clientY - d.y) / d.h, -0.3, 0.95) })
  }
  const onUp = () => {
    drag.current = null
  }

  const words: ReactNode[] = cat.fields.map((f) => {
    if (f.kind === 'items') return <ItemsField key={f.key} label={f.label} cols={f.cols!} rows={c.items} onChange={(items) => patch({ items })} />
    if (f.kind === 'area') return <FormatArea key={f.key} label={f.label} value={String(c[f.key] ?? '')} hint={f.hint} onChange={(v) => patch({ [f.key]: v })} />
    return <Field key={f.key} label={f.label} value={String(c[f.key] ?? '')} onChange={(v) => patch({ [f.key]: v })} placeholder={f.hint} />
  })

  const hasSocials = socialLines(profile).length > 0

  return (
    <>
      <PageHeader title={cat.name} onBack={() => nav(`/app/templates/${cat.id}`)} />
      <main className="wrap">
        <div className="a-pagehead">
          <div>
            <h1>
              {style.name} <em>{cat.word}</em>
            </h1>
            <p className="mu">Ready made, and yours to change. Type your words, choose what shows, change the colours and fonts, or add a picture.</p>
          </div>
        </div>
        <div className="gl-chips" role="tablist" aria-label="Designs">
          {cat.styles.map((s) => (
            <button key={s.id} role="tab" aria-selected={s.id === style.id} className={s.id === style.id ? 'on' : ''} onClick={() => nav(`/app/templates/${cat.id}/${s.id}`, { replace: true })}>
              {s.name}
            </button>
          ))}
        </div>
        <div className="gl-maker">
          <div className="gl-form">
            <div className="seg gl-tabs" role="tablist" aria-label="What to change">
              {(
                [
                  ['words', 'Words'],
                  ['show', 'Show'],
                  ['style', 'Style'],
                  ['pic', 'Picture'],
                ] as [Tab, string][]
              ).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                  {l}
                </button>
              ))}
            </div>

            {tab === 'words' && (
              <Section title="Your words">
                {words}
                <button className="btn g" onClick={reset}>
                  Start again with the starting words
                </button>
              </Section>
            )}

            {tab === 'show' && (
              <Section title="What shows on the design">
                <Tick label="Logo" hint={o.logo ? 'Using the logo you added for this design' : profile.logo ? 'Your logo from your profile' : 'Your initials, until you add a logo'} on={o.showLogo} set={(v) => setO({ showLogo: v })} />
                {o.showLogo && (
                  <div className="gl-row">
                    <Upload
                      label={o.logo ? 'Change this logo' : 'Use a different logo'}
                      onFile={async (f) => {
                        try {
                          setO({ logo: await readImage(f, 500, false) })
                        } catch {
                          toast('That file is not a picture we can use')
                        }
                      }}
                    />
                    {o.logo && (
                      <button className="btn g" onClick={() => setO({ logo: '' })}>
                        Use my profile logo
                      </button>
                    )}
                  </div>
                )}
                <Tick label="Phone number" hint={profile.phone || 'Add it in your profile'} on={o.showPhone} set={(v) => setO({ showPhone: v })} />
                <Tick label="Social media handles" hint={hasSocials ? socialLines(profile).map((x) => x.handle).join(', ') : 'Add them in your profile'} on={o.showSocials} set={(v) => setO({ showSocials: v })} disabled={!hasSocials} />
                {cat.sign && <Tick label="Your signature" hint={profile.signature ? 'Your saved signature' : 'Add your signature in your profile first'} on={o.showSign} set={(v) => setO({ showSign: v })} disabled={!profile.signature} />}
                <Tick label="Made with Generate" hint="A small line at the bottom of the design" on={o.mark} set={(v) => setO({ mark: v })} />
              </Section>
            )}

            {tab === 'style' && (
              <Section title="Colours, background and fonts">
                <Choice<Align>
                  label="Line up the words"
                  value={o.align}
                  options={[
                    ['', 'Design'],
                    ['l', 'Left'],
                    ['c', 'Centre'],
                    ['r', 'Right'],
                  ]}
                  onChange={(v) => setO({ align: v })}
                />
                <Swatches label="Main colour" value={o.color} colours={MAIN_COLOURS} onChange={(v) => setO({ color: v })} />
                <Swatches label="Background colour" value={o.bg} colours={BG_COLOURS} onChange={(v) => setO({ bg: v })} />
                <div className="f">
                  <span>Background picture</span>
                  <div className="gl-row">
                    <Upload label={o.bgImage ? 'Change the picture' : 'Add a background picture'} onFile={(f) => photo(f, (url) => setO({ bgImage: url }))} />
                    {o.bgImage && (
                      <button className="btn g" onClick={() => setO({ bgImage: '' })}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {o.bgImage && <Slider label="How strong the picture shows" value={o.bgOpacity} min={0.05} max={1} step={0.05} show={`${Math.round(o.bgOpacity * 100)}%`} onChange={(v) => setO({ bgOpacity: v })} />}
                <label className="f">
                  <span>Heading font</span>
                  <select value={o.headFont} onChange={(e) => setO({ headFont: e.target.value })}>
                    {CARD_FONTS.map(([v, l]) => (
                      <option key={l} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <Slider label="Heading size" value={o.headSize} min={0.6} max={1.4} step={0.05} show={`${Math.round(o.headSize * 100)}%`} onChange={(v) => setO({ headSize: v })} />
                <label className="f">
                  <span>Text font</span>
                  <select value={o.textFont} onChange={(e) => setO({ textFont: e.target.value })}>
                    {CARD_FONTS.map(([v, l]) => (
                      <option key={l} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <Slider label="Text size" value={o.textSize} min={0.75} max={1.35} step={0.05} show={`${Math.round(o.textSize * 100)}%`} onChange={(v) => setO({ textSize: v })} />
                <button className="btn g" onClick={resetStyle}>
                  Back to the design's own style
                </button>
              </Section>
            )}

            {tab === 'pic' && (
              <Section title="Add a picture">
                <p className="mu small gl-p">Add a photo of your product, your shop or yourself. Drag it on the design to move it.</p>
                <div className="gl-row">
                  <Upload label={o.pic ? 'Change the picture' : 'Add a picture'} onFile={(f) => photo(f, (url, aspect) => setO({ pic: url, picAspect: aspect }))} />
                  {o.pic && (
                    <button className="btn g" onClick={() => setO({ pic: '' })}>
                      Remove
                    </button>
                  )}
                </div>
                {o.pic && (
                  <>
                    <Slider label="Size" value={o.picW} min={0.15} max={1} step={0.01} show={`${Math.round(o.picW * 100)}%`} onChange={(v) => setO({ picW: v })} />
                    <Choice<PicShape>
                      label="Shape"
                      value={o.picShape}
                      options={[
                        ['square', 'Square corners'],
                        ['rounded', 'Rounded'],
                        ['circle', 'Circle'],
                      ]}
                      onChange={(v) => setO({ picShape: v })}
                    />
                    <button className="btn g" onClick={() => setO({ picX: (1 - o.picW) / 2 })}>
                      Put it in the middle
                    </button>
                  </>
                )}
              </Section>
            )}
          </div>
          <div className="gl-live">
            <div ref={live} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
              <CardFrame cat={cat} style={style.id} c={c} profile={profile} />
            </div>
            <div className="gl-actions">
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
            <p className="gl-hint">The picture is sharp enough for your WhatsApp status, Instagram and printing. What you change is kept on this device.</p>
          </div>
        </div>
      </main>
    </>
  )
}
