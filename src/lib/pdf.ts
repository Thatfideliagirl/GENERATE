import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Doc, Profile } from './types'
import { DocumentPaper } from '../components/DocumentPaper'
import { paperOf } from './style'
import { DOC_LABEL } from './constants'

/** Draws the document off screen and turns it into an A4 PDF (more pages if it is long). */
export async function makePdf(doc: Doc, profile: Profile): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])

  const host = document.createElement('div')
  host.style.cssText = 'position:absolute;left:-9999px;top:0;width:760px'
  host.setAttribute('aria-hidden', 'true')
  host.innerHTML = renderToStaticMarkup(createElement(DocumentPaper, { doc, profile }))
  document.body.appendChild(host)

  try {
    try {
      await Promise.all(
        ['Fraunces', 'Cormorant Garamond', 'Instrument Sans', 'Playfair Display', 'Nunito', 'IBM Plex Mono'].map(
          (f) => document.fonts.load(`16px "${f}"`),
        ),
      )
      await document.fonts.ready
    } catch {
      /* fonts are a nice to have, carry on */
    }

    const paperColour = paperOf(doc.style || profile.style)
    const el = host.firstElementChild as HTMLElement
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: paperColour, useCORS: true })

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const W = pdf.internal.pageSize.getWidth()
    const H = pdf.internal.pageSize.getHeight()
    const pageHeight = Math.floor((canvas.width * H) / W)

    let y = 0
    let first = true
    while (y < canvas.height - Math.ceil(pageHeight * 0.01) || y === 0) {
      const h = Math.min(pageHeight, canvas.height - y)
      const page = document.createElement('canvas')
      page.width = canvas.width
      page.height = pageHeight
      const ctx = page.getContext('2d')!
      ctx.fillStyle = paperColour
      ctx.fillRect(0, 0, page.width, page.height)
      ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h)
      if (!first) pdf.addPage()
      pdf.addImage(page.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, W, H)
      first = false
      y += pageHeight
    }
    return pdf.output('blob')
  } finally {
    host.remove()
  }
}

export function pdfName(doc: Doc): string {
  return `${DOC_LABEL[doc.type]} ${doc.number} ${doc.client.name || ''}`.trim().replace(/[\\/:*?"<>|]/g, '') + '.pdf'
}

/** Saves a file to the person's device. */
export function saveFile(name: string, blob: Blob): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}
