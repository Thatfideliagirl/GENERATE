import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Profile } from './types'
import type { CardContent, Category } from './studio'
import { StudioCard, fitCard } from '../components/StudioCard'

const FONTS = ['Geist', 'Fraunces', 'Caveat', 'Cormorant Garamond', 'Bodoni Moda', 'Hanken Grotesk', 'Playfair Display', 'Great Vibes', 'Instrument Serif']

/** Draws a gallery design off screen at its real size and returns it as a canvas twice as sharp. */
async function draw(cat: Category, style: string, c: CardContent, profile: Profile): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas')
  const host = document.createElement('div')
  host.style.cssText = `position:absolute;left:-9999px;top:0;width:${cat.size.w}px`
  host.setAttribute('aria-hidden', 'true')
  host.innerHTML = renderToStaticMarkup(createElement(StudioCard, { cat: cat.id, style, c, profile }))
  document.body.appendChild(host)
  try {
    try {
      await Promise.all(FONTS.flatMap((f) => [document.fonts.load(`16px "${f}"`), document.fonts.load(`italic 16px "${f}"`)]))
      await document.fonts.ready
    } catch {
      /* fonts are a nice to have */
    }
    const el = host.firstElementChild as HTMLElement
    fitCard(el)
    return await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null, width: cat.size.w, height: cat.size.h })
  } finally {
    host.remove()
  }
}

export async function cardPng(cat: Category, style: string, c: CardContent, profile: Profile): Promise<Blob> {
  const canvas = await draw(cat, style, c, profile)
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('no image'))), 'image/png'))
}

/** For documents like the delivery note: the same picture on an A4 page. */
export async function cardPdf(cat: Category, style: string, c: CardContent, profile: Profile): Promise<Blob> {
  const [canvas, { jsPDF }] = await Promise.all([draw(cat, style, c, profile), import('jspdf')])
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const h = Math.min(H, (canvas.height * W) / canvas.width)
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, W, h)
  return pdf.output('blob')
}
