import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { PayData } from '../lib/links'
import { unpack } from '../lib/share'
import { fmtDate, money } from '../lib/format'
import { waLink } from '../lib/whatsapp'
import { initialsOf } from '../lib/initials'
import { WhatsAppIcon } from '../components/Icons'

function CopyRow({ k, v }: { k: string; v: string }) {
  const [done, setDone] = useState(false)
  return (
    <div className="pp-row">
      <span>{k}</span>
      <b>{v}</b>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(v)
            setDone(true)
            window.setTimeout(() => setDone(false), 1800)
          } catch {
            /* the person can still read and type it */
          }
        }}
      >
        {done ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

/** The page a client opens from a pay link: what to pay, and where. No account needed. */
export default function PayPage() {
  const { code = '' } = useParams()
  const [d, setD] = useState<PayData | null | undefined>(undefined)
  useEffect(() => {
    unpack<PayData>(code).then(setD)
  }, [code])

  if (d === undefined) return <div className="pp" />
  if (!d)
    return (
      <div className="pp">
        <main className="pp-card">
          <h1>This link does not open</h1>
          <p className="mu">Ask the business to send it again.</p>
        </main>
      </div>
    )

  const done = d.bal <= 0
  const msg = `Hello ${d.biz}, I have paid ${money(d.bal, d.cur)} for invoice ${d.n}. Thank you.`
  return (
    <div className="pp">
      <main className="pp-card">
        <div className="pp-biz">
          <span className="mono" style={{ width: 44, height: 44, fontSize: 16, borderRadius: 13 }}>
            {initialsOf(d.biz)}
          </span>
          <span>
            <b>{d.biz}</b>
            <small>
              Invoice {d.n}
              {d.cl ? ` for ${d.cl}` : ''}
            </small>
          </span>
        </div>

        <div className="pp-amt">
          <span>{done ? 'Fully paid' : d.paid > 0 ? 'Left to pay' : 'Amount to pay'}</span>
          <b className="num">{money(d.bal, d.cur)}</b>
          {d.due && !done && <small>Due {fmtDate(d.due)}</small>}
          {d.paid > 0 && (
            <small>
              {money(d.paid, d.cur)} paid of {money(d.total, d.cur)}
            </small>
          )}
        </div>

        {d.items.length > 0 && (
          <div className="pp-items">
            {d.items.map(([name, amt], i) => (
              <div key={i}>
                <span>{name || 'Item'}</span>
                <span className="num">{money(amt, d.cur)}</span>
              </div>
            ))}
          </div>
        )}

        {!done && (d.bank.acct ? (
          <div className="pp-bank">
            <p>Pay by bank transfer</p>
            {d.bank.bank && <CopyRow k="Bank" v={d.bank.bank} />}
            <CopyRow k="Account number" v={d.bank.acct} />
            {d.bank.name && <CopyRow k="Account name" v={d.bank.name} />}
          </div>
        ) : (
          <p className="mu">Ask {d.biz} for their bank details.</p>
        ))}

        {!done && d.phone && (
          <a className="btn wa full pp-paid" href={waLink(d.phone, msg)} target="_blank" rel="noreferrer">
            <WhatsAppIcon />
            I have paid, tell {d.biz}
          </a>
        )}
        <p className="pp-note">Your money goes straight to {d.biz}. Generate never holds it.</p>
      </main>
      <a className="pp-made" href="#/">
        Made with <b>Generate</b>
      </a>
    </div>
  )
}
