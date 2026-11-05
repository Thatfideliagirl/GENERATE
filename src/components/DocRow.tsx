import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Doc, DocType, Profile } from '../lib/types'
import { DOC_LABEL, STATUS_LABEL } from '../lib/constants'
import { balanceOf, paidOf, statusOf, totals } from '../lib/calc'
import { fmtDate, money } from '../lib/format'
import { makePdf, pdfName, saveFile } from '../lib/pdf'
import { ContractIcon, DownloadIcon, InvoiceIcon, ReceiptIcon } from './Icons'
import { useToast } from './Toast'

export const TYPE_ICON: Record<DocType, JSX.Element> = { invoice: <InvoiceIcon />, receipt: <ReceiptIcon />, contract: <ContractIcon /> }

/** One document in a list: who it is for, its number and date, the amount and its status, and a quick PDF download. */
export function DocRow({ d, profile, showDate = true, download = true }: { d: Doc; profile: Profile; showDate?: boolean; download?: boolean }) {
  const nav = useNavigate()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const st = statusOf(d)
  const left = d.type === 'invoice' && (st === 'part' || (st === 'overdue' && paidOf(d) > 0)) ? money(balanceOf(d), d.currency) : ''
  const amount = d.type === 'contract' ? (d.fee ? money(d.fee, d.currency) : '') : money(totals(d).total, d.currency)

  const get = async () => {
    setBusy(true)
    toast('Preparing your PDF')
    try {
      saveFile(pdfName(d), await makePdf(d, profile))
    } catch {
      toast('Could not make the PDF. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="a-docrow">
      <button className="row" onClick={() => nav(`/app/doc/${d.id}`)}>
        <span className="l">
          <span className={'a-dico ' + d.type}>{TYPE_ICON[d.type]}</span>
          <span>
            <b>{d.client.name || (d.type === 'contract' && d.title) || 'No client yet'}</b>
            <span className="mu small">
              {DOC_LABEL[d.type]} {d.number}
              {showDate ? ` · ${fmtDate(d.issueDate)}` : ''}
            </span>
          </span>
        </span>
        <span className="r">
          {amount && <b>{amount}</b>}
          {left ? <span className="mu small">{left} left</span> : null}
          <span className={'bd ' + st}>{STATUS_LABEL[st]}</span>
        </span>
      </button>
      {download && (
        <button className="a-dl" onClick={get} disabled={busy} aria-label={`Download ${DOC_LABEL[d.type]} ${d.number} as a PDF`}>
          <DownloadIcon />
        </button>
      )}
    </div>
  )
}
