import type { CSSProperties } from 'react'
import type { Doc, Profile } from '../lib/types'
import { DOC_LABEL } from '../lib/constants'
import { balanceOf, paidOf, totals } from '../lib/calc'
import { fmtDate, money } from '../lib/format'
import { accentOf, fontOf, layoutOf, paperOf, textOf } from '../lib/style'
import { resolveText, toBlocks } from '../lib/text'
import { socialLines } from '../lib/social'

/**
 * The document itself: what gets previewed, downloaded as a PDF and sent.
 * It is always drawn 760 pixels wide so the preview and the PDF match exactly.
 */
export function DocumentPaper({ doc, profile }: { doc: Doc; profile: Profile }) {
  const style = doc.style || profile.style
  const cssVars = {
    '--ac': accentOf(style),
    '--tx': textOf(style),
    background: paperOf(style),
  } as CSSProperties

  const contact = [profile.email, profile.phone, profile.address].filter(Boolean)
  const signature = doc.useSig && profile.signature ? profile.signature : ''
  const c = doc.currency
  const t = totals(doc)
  const isReceipt = doc.type === 'receipt'
  const socials = doc.showSocials ? socialLines(profile) : []

  return (
    <div className={`paper l-${layoutOf(style)} f-${fontOf(style)}`} style={cssVars}>
      <div className="ph">
        <div className="who">
          {profile.logo && <img className="lg" src={profile.logo} alt="" />}
          <div>
            <div className="bn">{profile.name}</div>
            <div className="ct">
              {contact.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="ttl">{DOC_LABEL[doc.type]}</div>
      </div>

      <div className="pb">
        {doc.type === 'contract' ? (
          <>
            <h3 className="c3">{resolveText(doc.title, doc, profile)}</h3>
            <div className="cb">
              {toBlocks(resolveText(doc.body, doc, profile)).map((b, i) =>
                b.kind === 'heading' ? (
                  <h4 key={i}>{b.text}</h4>
                ) : (
                  <p key={i}>
                    {b.lines.map((l, j) => (
                      <span key={j}>
                        {l}
                        {j < b.lines.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                ),
              )}
            </div>
            <div className="sg2">
              <div>
                <div className="sp">{signature && <img src={signature} alt="" />}</div>
                <div className="ln">
                  {profile.owner || profile.name}
                  <br />
                  <span className="soft">{profile.name}</span>
                </div>
              </div>
              <div>
                <div className="sp" />
                <div className="ln">
                  {doc.client.name || 'Client name'}
                  <br />
                  <span className="soft">Client</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="meta">
              <div>
                <span>Number</span>
                {doc.number}
              </div>
              <div>
                <span>{isReceipt ? 'Date paid' : 'Issued'}</span>
                {fmtDate(doc.issueDate)}
              </div>
              {!isReceipt && doc.dueDate && (
                <div>
                  <span>Due</span>
                  {fmtDate(doc.dueDate)}
                </div>
              )}
              {isReceipt && (
                <div>
                  <span>Paid by</span>
                  {doc.method}
                </div>
              )}
            </div>

            <div className="to">
              <span>{isReceipt ? 'Received from' : 'Billed to'}</span>
              <b>{doc.client.name || 'Client name'}</b>
              {[doc.client.email, doc.client.phone, doc.client.address].filter(Boolean).map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="r">Qty</th>
                  <th className="r">Price</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.filter((i) => i.d || i.p).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="soft">
                      No items yet
                    </td>
                  </tr>
                ) : (
                  doc.items
                    .filter((i) => i.d || i.p)
                    .map((i, k) => (
                      <tr key={k}>
                        <td>{i.d}</td>
                        <td className="r">{Number(i.q) || 0}</td>
                        <td className="r">{money(i.p, c)}</td>
                        <td className="r">{money((Number(i.q) || 0) * (Number(i.p) || 0), c)}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>

            <div className="tt">
              <div>
                <span>Subtotal</span>
                <span>{money(t.sub, c)}</span>
              </div>
              {t.disc > 0 && (
                <div>
                  <span>Discount</span>
                  <span>{money(t.disc, c)} off</span>
                </div>
              )}
              {doc.vat && (
                <div>
                  <span>VAT ({t.rate}%)</span>
                  <span>{money(t.vat, c)}</span>
                </div>
              )}
              <div className="g">
                <span>{isReceipt ? 'Amount paid' : 'Total due'}</span>
                <span>{money(t.total, c)}</span>
              </div>
              {!isReceipt && paidOf(doc) > 0 && (
                <>
                  <div>
                    <span>Paid so far</span>
                    <span>{money(paidOf(doc), c)}</span>
                  </div>
                  <div className="bal">
                    <span>Balance due</span>
                    <span>{money(balanceOf(doc), c)}</span>
                  </div>
                </>
              )}
            </div>

            {!isReceipt && profile.bank.acct && (
              <div className="pay">
                <span>Pay to</span>
                <b>{profile.bank.name || profile.name}</b>
                <br />
                {profile.bank.bank} {profile.bank.acct}
              </div>
            )}

            {doc.notes && <div className="nt">{doc.notes}</div>}

            {signature && (
              <div className="sg">
                <img src={signature} alt="" />
                <div className="ln">{profile.owner || profile.name}</div>
              </div>
            )}

            {isReceipt && <div className="thx">Thank you for your payment.</div>}
          </>
        )}
      </div>
      {socials.length > 0 && (
        <div className="soc">
          {socials.map((s) => (
            <span key={s.label}>
              {s.label} <b>@{s.handle}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
