import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragEvent, PointerEvent as RPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { Profile } from '../lib/types'
import { PageHeader } from '../components/TopBar'
import { DrawSignatureModal } from '../components/SignatureModals'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { initialsOf } from '../lib/initials'
import { fmtDate, today, uid } from '../lib/format'
import { exportSigned, fileToPdfBytes, lineImage, loadPdfjs, textToImage } from '../lib/signpdf'
import type { Placed } from '../lib/signpdf'
import { saveFile } from '../lib/pdf'

const MAX_WIDTH = 860

function imageAspect(src: string): Promise<number> {
  return new Promise((ok) => {
    const i = new Image()
    i.onload = () => ok(i.naturalWidth / Math.max(1, i.naturalHeight))
    i.onerror = () => ok(2.5)
    i.src = src
  })
}

/** Open a PDF or picture, drop your signature, initials, the date or some text on any page, and save the signed copy. Nothing leaves the device. */
export default function SignDocument({ profile }: { profile: Profile }) {
  const nav = useNavigate()
  const toast = useToast()
  const [bytes, setBytes] = useState<Uint8Array | null>(null)
  const [name, setName] = useState('')
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [sizes, setSizes] = useState<{ w: number; h: number }[]>([])
  const [items, setItems] = useState<Placed[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [width, setWidth] = useState(MAX_WIDTH)
  const [modal, setModal] = useState<'draw' | 'text' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const pageEls = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    const fit = () => {
      const el = wrap.current
      const pad = el ? parseFloat(getComputedStyle(el).paddingLeft) + parseFloat(getComputedStyle(el).paddingRight) : 36
      setWidth(Math.min(MAX_WIDTH, Math.max(240, Math.floor((el?.clientWidth ?? window.innerWidth) - pad))))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [pdf])

  const open = useCallback(async (file: File) => {
    setError('')
    setBusy(true)
    try {
      const data = await fileToPdfBytes(file)
      const lib = await loadPdfjs()
      const doc = await lib.getDocument({ data: data.slice() }).promise
      const list: { w: number; h: number }[] = []
      for (let n = 1; n <= doc.numPages; n++) {
        const v = (await doc.getPage(n)).getViewport({ scale: 1 })
        list.push({ w: v.width, h: v.height })
      }
      setBytes(data)
      setPdf(doc)
      setSizes(list)
      setItems([])
      setSel(null)
      setName(file.name.replace(/\.[^.]+$/, ''))
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setError(msg && !/Invalid|password|PDF/i.test(msg) ? msg : 'That file could not be opened. If it has a password, remove the password first and try again.')
    } finally {
      setBusy(false)
    }
  }, [])

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) open(f)
  }

  /** Puts a new item in the middle of the page that is on screen. */
  const add = async (src: string, aspect: number, fw: number, text?: Placed['text']) => {
    // The page nearest the middle of the screen
    let page = 1
    let best = Infinity
    for (const k of Object.keys(pageEls.current)) {
      const r = pageEls.current[+k]?.getBoundingClientRect()
      if (!r) continue
      const d = r.top <= window.innerHeight / 2 && r.bottom >= window.innerHeight / 2 ? 0 : Math.min(Math.abs(r.top - window.innerHeight / 2), Math.abs(r.bottom - window.innerHeight / 2))
      if (d < best) [best, page] = [d, +k]
    }
    const el = pageEls.current[page]
    const size = sizes[page - 1]
    if (!el || !size) return
    const rect = el.getBoundingClientRect()
    const fh = (fw * rect.width) / aspect / rect.height
    const mid = (window.innerHeight / 2 - rect.top) / rect.height
    // Each new item sits a little lower than the last, so they do not land on top of each other.
    const count = items.filter((i) => i.page === page).length
    const fy = Math.min(1 - fh, Math.max(0, mid - fh / 2 + count * 0.07))
    const fx = Math.min(1 - fw, Math.max(0, 0.5 - fw / 2 + (count % 2 ? 0.08 : 0)))
    const item: Placed = { id: uid(), page, src, fx, fy, fw, aspect, text }
    setItems((l) => [...l, item])
    setSel(item.id)
  }

  const addSaved = async () => {
    if (!profile.signature) return setModal('draw')
    add(profile.signature, await imageAspect(profile.signature), 0.3)
  }

  const addText = async (value: string, script: boolean, replaceId?: string) => {
    const v = value.trim()
    if (!v) return
    const t = await textToImage(v, script)
    if (replaceId) {
      setItems((l) => l.map((i) => (i.id === replaceId ? { ...i, src: t.src, aspect: t.aspect, text: { value: v, script } } : i)))
    } else {
      add(t.src, t.aspect, Math.min(0.45, Math.max(0.1, v.length * 0.022)), { value: v, script })
    }
  }

  const patch = (id: string, p: Partial<Placed>) => setItems((l) => l.map((i) => (i.id === id ? { ...i, ...p } : i)))
  const remove = (id: string) => {
    setItems((l) => l.filter((i) => i.id !== id))
    setSel(null)
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel && !(e.target instanceof HTMLInputElement)) remove(sel)
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [sel])

  const download = async () => {
    if (!bytes) return
    if (!items.length) return toast('Add a signature or some text first.')
    setBusy(true)
    try {
      const out = await exportSigned(bytes, items)
      saveFile(`${name || 'document'} signed.pdf`, new Blob([out as BlobPart], { type: 'application/pdf' }))
      toast('Signed copy saved')
    } catch {
      toast('The signed copy could not be made. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    pdf?.destroy()
    setPdf(null)
    setBytes(null)
    setItems([])
    setSel(null)
    setSizes([])
  }

  const editing = items.find((i) => i.id === editId)

  return (
    <>
      <PageHeader title="Sign a document" onBack={() => nav('/app')} />
      <main className="wrap sign" ref={wrap}>
        {!pdf ? (
          <div
            className={'sg-drop' + (over ? ' over' : '')}
            onDragOver={(e) => (e.preventDefault(), setOver(true))}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
            <h1>Get your document signed without stress.</h1>
            <p>Choose a PDF or a picture of a document. Scroll to the right place, add your signature, and save a signed copy.</p>
            <label className="btn p filebtn">
              {busy ? 'Opening' : 'Choose a document'}
              <input type="file" accept="application/pdf,.pdf,image/png,image/jpeg,image/webp" hidden onChange={(e) => (e.target.files?.[0] && open(e.target.files[0]), (e.target.value = ''))} />
            </label>
            <p className="mu small">You can also drop a file here. It stays on your device. Nothing is uploaded.</p>
            {error && (
              <p className="err" role="alert">
                {error}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="sg-tools" role="toolbar" aria-label="Add to the document">
              <button className="btn" onClick={addSaved}>
                {profile.signature ? 'My signature' : 'Draw signature'}
              </button>
              {profile.signature && (
                <button className="btn" onClick={() => setModal('draw')}>
                  Draw a new one
                </button>
              )}
              <button className="btn" onClick={() => addText(initialsOf(profile.owner || profile.name), false)}>
                Initials
              </button>
              <button className="btn" onClick={() => addText(fmtDate(today()), false)}>
                Date
              </button>
              <button className="btn" onClick={() => (setEditId(null), setModal('text'))}>
                Text
              </button>
              <button
                className="btn"
                onClick={() => {
                  const l = lineImage()
                  add(l.src, l.aspect, 0.3)
                }}
              >
                Line
              </button>
            </div>
            <p className="mu small sg-hint">Scroll to the page, tap what to add, then drag it into place. Drag the corner to make it bigger or smaller.</p>
            <div className="sg-pages" onPointerDown={(e) => e.target === e.currentTarget && setSel(null)}>
              {sizes.map((s, i) => (
                <PageView
                  key={i}
                  pdf={pdf}
                  n={i + 1}
                  width={width}
                  ratio={s.h / s.w}
                  items={items.filter((it) => it.page === i + 1)}
                  sel={sel}
                  onSel={setSel}
                  onPatch={patch}
                  onRemove={remove}
                  onEdit={(id) => (setEditId(id), setModal('text'))}
                  refEl={(el) => (pageEls.current[i + 1] = el)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {pdf && (
        <div className="bar">
          <button className="btn" onClick={reset}>
            Choose another
          </button>
          <button className="btn p" onClick={download} disabled={busy}>
            {busy ? 'Saving' : 'Download signed PDF'}
          </button>
        </div>
      )}

      {modal === 'draw' && (
        <DrawSignatureModal
          onClose={() => setModal(null)}
          onUse={async (src) => {
            setModal(null)
            add(src, await imageAspect(src), 0.3)
          }}
        />
      )}
      {modal === 'text' && <TextModal initial={editing?.text} onClose={() => setModal(null)} onUse={(v, script) => (setModal(null), addText(v, script, editing?.id))} />}
    </>
  )
}

function TextModal({ initial, onClose, onUse }: { initial?: { value: string; script: boolean }; onClose: () => void; onUse: (v: string, script: boolean) => void }) {
  const [v, setV] = useState(initial?.value ?? '')
  const [script, setScript] = useState(initial?.script ?? false)
  return (
    <Modal label="Add text" onClose={onClose}>
      <h3 className="s">{initial ? 'Change the text' : 'Add text'}</h3>
      <label className="f">
        <span>What should it say</span>
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && v.trim() && onUse(v, script)} placeholder="For example, Lagos, 12 Oct 2026" maxLength={80} />
      </label>
      <div className="chips">
        <button className={'chip' + (!script ? ' on' : '')} onClick={() => setScript(false)}>
          Plain
        </button>
        <button className={'chip' + (script ? ' on' : '')} onClick={() => setScript(true)}>
          Handwriting
        </button>
      </div>
      <div className="row2">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn p" disabled={!v.trim()} onClick={() => onUse(v, script)}>
          {initial ? 'Save' : 'Add'}
        </button>
      </div>
    </Modal>
  )
}

interface PageProps {
  pdf: PDFDocumentProxy
  n: number
  width: number
  ratio: number
  items: Placed[]
  sel: string | null
  onSel: (id: string | null) => void
  onPatch: (id: string, p: Partial<Placed>) => void
  onRemove: (id: string) => void
  onEdit: (id: string) => void
  refEl: (el: HTMLDivElement | null) => void
}

function PageView({ pdf, n, width, ratio, items, sel, onSel, onPatch, onRemove, onEdit, refEl }: PageProps) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [near, setNear] = useState(n === 1)
  const drawn = useRef(0)

  useEffect(() => {
    refEl(box.current)
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(
      (list) => {
        if (list.some((e) => e.isIntersecting)) setNear(true)
      },
      { rootMargin: '700px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!near || drawn.current === width) return
    let cancelled = false
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null
    ;(async () => {
      const page = await pdf.getPage(n)
      const base = page.getViewport({ scale: 1 })
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const vp = page.getViewport({ scale: (width / base.width) * dpr })
      const c = canvas.current
      if (!c || cancelled) return
      c.width = Math.floor(vp.width)
      c.height = Math.floor(vp.height)
      task = page.render({ canvasContext: c.getContext('2d')!, viewport: vp })
      try {
        await task.promise
        drawn.current = width
      } catch {
        /* a newer draw replaced this one */
      }
    })()
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [near, width, pdf, n])

  const height = Math.round(width * ratio)

  const start = (e: RPointerEvent, it: Placed, mode: 'move' | 'size') => {
    e.stopPropagation()
    onSel(it.id)
    const page = box.current!.getBoundingClientRect()
    const x0 = e.clientX
    const y0 = e.clientY
    const o = { fx: it.fx, fy: it.fy, fw: it.fw }
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    const move = (m: PointerEvent) => {
      const dx = (m.clientX - x0) / page.width
      const dy = (m.clientY - y0) / page.height
      if (mode === 'move') {
        const fh = (o.fw * page.width) / it.aspect / page.height
        onPatch(it.id, { fx: Math.min(1 - o.fw, Math.max(0, o.fx + dx)), fy: Math.min(1 - fh, Math.max(0, o.fy + dy)) })
      } else {
        const fw = Math.min(0.9, Math.max(0.05, o.fw + dx))
        const fh = (fw * page.width) / it.aspect / page.height
        onPatch(it.id, { fw, fx: Math.min(o.fx, 1 - fw), fy: Math.min(o.fy, 1 - fh) })
      }
    }
    const up = () => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      target.removeEventListener('pointercancel', up)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
    target.addEventListener('pointercancel', up)
  }

  return (
    <div className="sg-page" ref={box} style={{ width, height }} data-page={n} onPointerDown={(e) => e.target === e.currentTarget && onSel(null)}>
      <canvas ref={canvas} style={{ width, height }} aria-label={`Page ${n}`} />
      <span className="sg-no">Page {n}</span>
      {items.map((it) => (
        <div
          key={it.id}
          className={'sg-item' + (sel === it.id ? ' on' : '')}
          style={{ left: `${it.fx * 100}%`, top: `${it.fy * 100}%`, width: `${it.fw * 100}%`, aspectRatio: String(it.aspect) }}
          onPointerDown={(e) => start(e, it, 'move')}
          onDoubleClick={() => it.text && onEdit(it.id)}
          tabIndex={0}
          role="button"
          aria-label={it.text ? `Text: ${it.text.value}` : 'Signature'}
          onFocus={() => onSel(it.id)}
        >
          <img src={it.src} alt="" draggable={false} />
          {sel === it.id && (
            <>
              <button className="sg-x" aria-label="Remove" onPointerDown={(e) => e.stopPropagation()} onClick={() => onRemove(it.id)}>
                ×
              </button>
              {it.text && (
                <button className="sg-ed" aria-label="Change the text" onPointerDown={(e) => e.stopPropagation()} onClick={() => onEdit(it.id)}>
                  Edit
                </button>
              )}
              <span className="sg-h" aria-label="Resize" onPointerDown={(e) => start(e, it, 'size')} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
