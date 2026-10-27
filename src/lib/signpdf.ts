import { PDFDocument, degrees } from 'pdf-lib'

/** One thing placed on a page: a signature, initials, a date or some text. Everything is a picture, so what you see is what is saved. */
export interface Placed {
  id: string
  /** Page number, starting at 1. */
  page: number
  /** PNG or JPEG data URL. */
  src: string
  /** Left edge as a fraction of the page width as shown on screen. */
  fx: number
  /** Top edge as a fraction of the page height as shown on screen. */
  fy: number
  /** Width as a fraction of the page width. */
  fw: number
  /** Width divided by height of the picture. */
  aspect: number
  /** Set for text items so they can be edited again. */
  text?: { value: string; script: boolean }
}

export const MAX_BYTES = 25 * 1024 * 1024

export async function loadPdfjs() {
  const lib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  if (!lib.GlobalWorkerOptions.workerSrc) {
    lib.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default
  }
  return lib
}

function dataUrlBytes(url: string): Uint8Array {
  const bin = atob(url.slice(url.indexOf(',') + 1))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Draws any picture file onto a canvas and returns it as a PNG. Used for webp and other types a PDF cannot hold. */
async function toPng(file: Blob): Promise<{ bytes: Uint8Array; w: number; h: number }> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => bad(new Error('That file is not a picture'))
      i.src = url
    })
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    c.getContext('2d')!.drawImage(img, 0, 0)
    return { bytes: dataUrlBytes(c.toDataURL('image/png')), w: c.width, h: c.height }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Gives back the bytes of a PDF. A picture is wrapped in a one page PDF first. */
export async function fileToPdfBytes(file: File): Promise<Uint8Array> {
  if (file.size > MAX_BYTES) throw new Error('That file is bigger than 25 MB. Try a smaller one.')
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (isPdf) return new Uint8Array(await file.arrayBuffer())
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error('Choose a PDF, or a picture in PNG, JPG or WebP.')
  const pdf = await PDFDocument.create()
  const buf = new Uint8Array(await file.arrayBuffer())
  let img
  if (file.type === 'image/png') img = await pdf.embedPng(buf)
  else if (file.type === 'image/jpeg' || file.type === 'image/jpg') img = await pdf.embedJpg(buf)
  else img = await pdf.embedPng((await toPng(file)).bytes)
  const width = 595
  const height = Math.round((width * img.height) / img.width)
  const page = pdf.addPage([width, height])
  page.drawImage(img, { x: 0, y: 0, width, height })
  return pdf.save()
}

/** Turns some text into a picture, so the same thing shows on screen and in the saved file. */
export async function textToImage(value: string, script: boolean): Promise<{ src: string; aspect: number }> {
  const family = script ? '"Great Vibes", "Dancing Script", cursive' : '"Hanken Grotesk", "Instrument Sans", system-ui, sans-serif'
  const weight = script ? 400 : 600
  const size = script ? 120 : 84
  try {
    // Wait a moment for the font, but never hold the person up if the connection is slow.
    await Promise.race([document.fonts.load(`${weight} ${size}px ${family}`), new Promise((ok) => setTimeout(ok, 700))])
  } catch {
    /* the fallback font is fine */
  }
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  const font = `${weight} ${size}px ${family}`
  ctx.font = font
  const pad = Math.round(size * 0.22)
  const w = Math.ceil(ctx.measureText(value).width) + pad * 2
  const h = Math.round(size * 1.45)
  c.width = w
  c.height = h
  const k = c.getContext('2d')!
  k.font = font
  k.fillStyle = '#14251F'
  k.textBaseline = 'middle'
  k.fillText(value, pad, h / 2 + size * 0.04)
  return { src: c.toDataURL('image/png'), aspect: w / h }
}

/** Turns any picture data URL into PNG or JPEG bytes that pdf-lib can place. */
async function embedable(src: string): Promise<{ bytes: Uint8Array; jpg: boolean }> {
  if (/^data:image\/png/.test(src)) return { bytes: dataUrlBytes(src), jpg: false }
  if (/^data:image\/jpe?g/.test(src)) return { bytes: dataUrlBytes(src), jpg: true }
  const blob = await (await fetch(src)).blob()
  return { bytes: (await toPng(blob)).bytes, jpg: false }
}

/** Writes every placed item into the original PDF and returns the new file. The rest of the document is left alone. */
export async function exportSigned(original: Uint8Array, items: Placed[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(original, { ignoreEncryption: true })
  const pages = pdf.getPages()
  const cache = new Map<string, Awaited<ReturnType<typeof pdf.embedPng>>>()

  for (const it of items) {
    const page = pages[it.page - 1]
    if (!page) continue
    let img = cache.get(it.src)
    if (!img) {
      const e = await embedable(it.src)
      img = e.jpg ? await pdf.embedJpg(e.bytes) : await pdf.embedPng(e.bytes)
      cache.set(it.src, img)
    }
    const box = page.getCropBox()
    const W = box.width
    const H = box.height
    const r = (((page.getRotation().angle % 360) + 360) % 360) as 0 | 90 | 180 | 270
    const viewW = r % 180 ? H : W
    const viewH = r % 180 ? W : H
    // The picture's bottom left and bottom right corners, as fractions of the page as shown, turned into PDF coordinates.
    const toPdf = (fx: number, fy: number): [number, number] => {
      let x = 0
      let y = 0
      if (r === 0) [x, y] = [fx * W, H - fy * H]
      else if (r === 90) [x, y] = [fy * W, fx * H]
      else if (r === 180) [x, y] = [W - fx * W, fy * H]
      else [x, y] = [W - fy * W, H - fx * H]
      return [box.x + x, box.y + y]
    }
    const widthPts = it.fw * viewW
    const heightPts = widthPts / it.aspect
    const fyBottom = it.fy + heightPts / viewH
    const [blx, bly] = toPdf(it.fx, fyBottom)
    const [brx, bry] = toPdf(it.fx + it.fw, fyBottom)
    const angle = (Math.atan2(bry - bly, brx - blx) * 180) / Math.PI
    page.drawImage(img, { x: blx, y: bly, width: widthPts, height: heightPts, rotate: degrees(angle) })
  }
  return pdf.save()
}
