import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import { useToast } from './Toast'
import { SIGNATURE_FONTS } from '../lib/constants'

interface Props {
  onClose: () => void
  onUse: (dataUrl: string) => void
}

const INK = '#14251F'

export function DrawSignatureModal({ onClose, onUse }: Props) {
  const toast = useToast()
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const touched = useRef(false)

  useEffect(() => {
    const ctx = canvas.current!.getContext('2d')!
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = INK
  }, [])

  const point = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const c = canvas.current!
    const r = c.getBoundingClientRect()
    return [((e.clientX - r.left) * c.width) / r.width, ((e.clientY - r.top) * c.height) / r.height]
  }

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvas.current!
    const ctx = c.getContext('2d')!
    drawing.current = true
    touched.current = true
    c.setPointerCapture(e.pointerId)
    const [x, y] = point(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 0.1, y + 0.1)
    ctx.stroke()
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvas.current!.getContext('2d')!
    const [x, y] = point(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const clear = () => {
    const c = canvas.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    touched.current = false
  }

  const use = () => {
    if (!touched.current) return toast('Draw your signature first')
    onUse(canvas.current!.toDataURL('image/png'))
  }

  return (
    <Modal label="Draw your signature" onClose={onClose}>
      <h3 className="s">Draw your signature</h3>
      <canvas
        ref={canvas}
        className="sigpad"
        width={560}
        height={200}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => (drawing.current = false)}
      />
      <p className="mu small">Sign with your finger or mouse.</p>
      <div className="row2">
        <button className="btn" onClick={clear}>
          Clear
        </button>
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn p" onClick={use}>
          Use signature
        </button>
      </div>
    </Modal>
  )
}

export function TypeSignatureModal({ onClose, onUse, initial }: Props & { initial: string }) {
  const toast = useToast()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [text, setText] = useState(initial)
  const [family, setFamily] = useState(SIGNATURE_FONTS[0][0])

  useEffect(() => {
    let cancelled = false
    const draw = async () => {
      try {
        await document.fonts.load(`64px "${family}"`)
      } catch {
        /* carry on with a fallback font */
      }
      if (cancelled) return
      const c = canvas.current!
      const ctx = c.getContext('2d')!
      ctx.clearRect(0, 0, c.width, c.height)
      const t = text.trim()
      if (!t) return
      let size = 96
      ctx.font = `${size}px "${family}"`
      while (ctx.measureText(t).width > c.width - 40 && size > 20) {
        size -= 4
        ctx.font = `${size}px "${family}"`
      }
      ctx.fillStyle = INK
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(t, c.width / 2, c.height / 2)
    }
    draw()
    return () => {
      cancelled = true
    }
  }, [text, family])

  const use = () => {
    if (!text.trim()) return toast('Type your name first')
    onUse(canvas.current!.toDataURL('image/png'))
  }

  return (
    <Modal label="Type your signature" onClose={onClose}>
      <h3 className="s">Type your signature</h3>
      <label className="f">
        <span>Your name</span>
        <input value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="chips">
        {SIGNATURE_FONTS.map(([f, name]) => (
          <button key={f} type="button" className={'chip' + (family === f ? ' on' : '')} onClick={() => setFamily(f)}>
            {name}
          </button>
        ))}
      </div>
      <canvas ref={canvas} className="sigpad" width={560} height={200} />
      <div className="row2">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn p" onClick={use}>
          Use signature
        </button>
      </div>
    </Modal>
  )
}
