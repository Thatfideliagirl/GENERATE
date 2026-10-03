import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Client, Doc, DocType, Item, Payment, Profile } from '../lib/types'
import { CURRENCIES, DOC_LABEL, PAY_METHODS, TRADE_ITEMS, TRADES } from '../lib/constants'
import { balanceOf, paidOf, statusOf, totals } from '../lib/calc'
import { clone, money, today, uid } from '../lib/format'
import { newDoc } from '../lib/factory'
import { CONTRACT_TEMPLATES } from '../lib/templates'
import { makePdf, pdfName, saveFile } from '../lib/pdf'
import { reminderMessage, sendMessage, waLink } from '../lib/whatsapp'
import type { ReminderTone } from '../lib/whatsapp'
import { Field, Grid2, Section, SelectField, TextArea } from '../components/Fields'
import { LookControls } from '../components/LookControls'
import { PaperPreview } from '../components/PaperPreview'
import { ReminderModal } from '../components/ReminderModal'
import { PageHeader } from '../components/TopBar'
import { useToast } from '../components/Toast'
import { useStore } from '../data/store'

/* ---------- routes: open a saved document, or start a new one ---------- */

export function OpenDoc({ profile }: { profile: Profile }) {
  const { id } = useParams()
  const { data } = useStore()
  const doc = data.docs.find((d) => d.id === id)
  if (!doc) return <Navigate to="/app" replace />
  return <Editor key={doc.id} initial={doc} profile={profile} />
}

export function NewDoc({ profile }: { profile: Profile }) {
  const { type } = useParams()
  const [search] = useSearchParams()
  const { data, nextNo } = useStore()
  const templateId = search.get('template') ?? ''
  const [initial] = useState<Doc | null>(() => {
    if (type !== 'invoice' && type !== 'receipt' && type !== 'contract') return null
    const tpl = [...CONTRACT_TEMPLATES, ...data.templates].find((t) => t.id === templateId)
    return newDoc(type as DocType, profile, nextNo(type as DocType), tpl)
  })
  if (!initial) return <Navigate to="/app" replace />
  return <Editor key={`${type}-${templateId}`} initial={initial} profile={profile} />
}

/* ---------- the editor ---------- */

function Editor({ initial, profile }: { initial: Doc; profile: Profile }) {
  const nav = useNavigate()
  const toast = useToast()
  const { data, saveDoc, deleteDoc, addTemplate, nextNo } = useStore()
  const [doc, setDoc] = useState<Doc>(initial)
  const [tab, setTab] = useState<'edit' | 'prev'>('edit')
  const [reminder, setReminder] = useState(false)
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const armTimer = useRef<number>()

  const isSaved = data.docs.some((d) => d.id === doc.id)
  const status = statusOf(doc)

  useEffect(() => () => window.clearTimeout(armTimer.current), [])
  useEffect(() => window.scrollTo(0, 0), [tab])

  const patch = (p: Partial<Doc>) => setDoc((d) => ({ ...d, ...p }))
  const patchClient = (p: Partial<Client>) => setDoc((d) => ({ ...d, client: { ...d.client, ...p } }))
  const patchItem = (i: number, p: Partial<Item>) =>
    setDoc((d) => ({ ...d, items: d.items.map((it, k) => (k === i ? { ...it, ...p } : it)) }))
  const patchPayment = (i: number, p: Partial<Payment>) =>
    setDoc((d) => ({ ...d, payments: d.payments.map((x, k) => (k === i ? { ...x, ...p } : x)) }))

  const isEmpty = !isSaved && !doc.client.name && doc.type !== 'contract' && !doc.items.some((i) => i.d || i.p)

  const persist = (d: Doc) => {
    saveDoc(d)
    if (!isSaved) nav(`/app/doc/${d.id}`, { replace: true })
  }

  const save = () => {
    persist(doc)
    toast('Saved')
  }

  const back = () => {
    if (isEmpty) toast('Nothing to save yet')
    else saveDoc(doc)
    nav('/app')
  }

  const addItem = () => patch({ items: [...doc.items, { d: '', q: '1', p: '' }] })
  const removeItem = (i: number) => {
    const items = doc.items.filter((_, k) => k !== i)
    patch({ items: items.length ? items : [{ d: '', q: '1', p: '' }] })
  }
  const quickAdd = (name: string) => {
    const blank = doc.items.length === 1 && !doc.items[0].d && !doc.items[0].p
    patch({ items: blank ? [{ ...doc.items[0], d: name }] : [...doc.items, { d: name, q: '1', p: '' }] })
  }

  const addPayment = () => patch({ payments: [...doc.payments, { amt: '', date: today(), method: 'Bank transfer' }] })
  const removePayment = (i: number) => patch({ payments: doc.payments.filter((_, k) => k !== i) })

  const openCopy = (copy: Doc, message: string) => {
    saveDoc(copy)
    nav(`/app/doc/${copy.id}`)
    toast(message)
  }

  const receiptForPayment = (i: number) => {
    const pm = doc.payments[i]
    const amount = Number(pm.amt) || 0
    if (!amount) return toast('Enter the amount first')
    saveDoc(doc)
    const r = newDoc('receipt', profile, nextNo('receipt'))
    const paidUpTo = doc.payments.slice(0, i + 1).reduce((a, x) => a + (Number(x.amt) || 0), 0)
    const left = Math.max(0, totals(doc).total - paidUpTo)
    Object.assign(r, {
      client: clone(doc.client),
      currency: doc.currency,
      items: [{ d: 'Payment for invoice ' + doc.number, q: '1', p: String(amount) }],
      vat: false,
      fromId: doc.id,
      style: clone(doc.style),
      useSig: doc.useSig,
      issueDate: pm.date || today(),
      method: pm.method || 'Bank transfer',
      notes: left > 0 ? 'Balance remaining: ' + money(left, doc.currency) : 'Paid in full. Thank you.',
    })
    openCopy(r, 'Receipt made')
  }

  const receiptForFull = () => {
    const paidInvoice: Doc = { ...doc, status: 'paid' }
    saveDoc(paidInvoice)
    const r = newDoc('receipt', profile, nextNo('receipt'))
    Object.assign(r, {
      client: clone(doc.client),
      currency: doc.currency,
      items: clone(doc.items),
      discount: doc.discount,
      vat: doc.vat,
      vatRate: doc.vatRate,
      fromId: doc.id,
      style: clone(doc.style),
      useSig: doc.useSig,
    })
    openCopy(r, 'Invoice marked as paid')
  }

  const duplicate = () => {
    saveDoc(doc)
    const copy: Doc = {
      ...clone(doc),
      id: uid(),
      number: nextNo(doc.type),
      status: doc.type === 'receipt' ? 'paid' : 'draft',
      payments: [],
      fromId: undefined,
      issueDate: today(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    openCopy(copy, 'Copy made')
  }

  const remove = () => {
    if (!armed) {
      setArmed(true)
      armTimer.current = window.setTimeout(() => setArmed(false), 3500)
      return
    }
    deleteDoc(doc.id)
    toast('Deleted')
    nav('/app', { replace: true })
  }

  const download = async () => {
    persist(doc)
    setBusy(true)
    toast('Preparing your PDF')
    try {
      saveFile(pdfName(doc), await makePdf(doc, profile))
    } catch {
      toast('Could not make the PDF. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const markSent = (): Doc => (doc.status === 'draft' && doc.type !== 'receipt' ? { ...doc, status: 'sent' } : doc)

  const sendOnWhatsApp = () => {
    const d = markSent()
    setDoc(d)
    persist(d)
    window.open(waLink(d.client.phone, sendMessage(d, profile)), '_blank')
    toast(d.status === 'sent' ? 'Marked as sent' : 'Opening WhatsApp')
  }

  const sendReminder = (tone: ReminderTone) => {
    const d = markSent()
    setDoc(d)
    persist(d)
    window.open(waLink(d.client.phone, reminderMessage(d, profile, tone)), '_blank')
    setReminder(false)
    toast('Reminder ready in WhatsApp')
  }

  const quickItems = TRADE_ITEMS[profile.trade]

  return (
    <>
      <PageHeader title={`${DOC_LABEL[doc.type]} ${doc.number}`} onBack={back} />
      <main className="wrap">
        <div className="seg">
          <button className={tab === 'edit' ? 'on' : ''} onClick={() => setTab('edit')}>
            Details
          </button>
          <button className={tab === 'prev' ? 'on' : ''} onClick={() => setTab('prev')}>
            Preview
          </button>
        </div>

        {tab === 'edit' ? (
          <>
            {doc.type === 'contract' ? (
              <ContractForm doc={doc} profile={profile} patch={patch} patchClient={patchClient} onSaveFirst={() => persist(doc)} />
            ) : (
              <>
                <Grid2>
                  <Field label="Number" value={doc.number} onChange={(v) => patch({ number: v })} />
                  <Field label={doc.type === 'receipt' ? 'Date paid' : 'Issue date'} type="date" value={doc.issueDate} onChange={(v) => patch({ issueDate: v })} />
                </Grid2>
                {doc.type === 'receipt' ? (
                  <SelectField label="Paid by" value={doc.method} onChange={(v) => patch({ method: v })} options={PAY_METHODS.map((m) => [m, m])} />
                ) : (
                  <Grid2>
                    <Field label="Due date" type="date" value={doc.dueDate} onChange={(v) => patch({ dueDate: v })} />
                    <SelectField
                      label="Status"
                      value={doc.status}
                      onChange={(v) => patch({ status: v as Doc['status'] })}
                      options={[
                        ['draft', 'Draft'],
                        ['sent', 'Sent'],
                        ['paid', 'Paid'],
                      ]}
                    />
                  </Grid2>
                )}

                <Section title={doc.type === 'receipt' ? 'Received from' : 'Billed to'}>
                  <ClientFields client={doc.client} patchClient={patchClient} />
                </Section>

                <Section title={doc.type === 'receipt' ? 'What was paid for' : 'Items'}>
                  {quickItems && (
                    <div className="lk">
                      <span className="mu small">Quick add for {profile.trade === 'other' && profile.tradeOther ? profile.tradeOther : TRADES[profile.trade]}</span>
                      <div className="chips">
                        {quickItems.map((name) => (
                          <button key={name} type="button" className="chip" onClick={() => quickAdd(name)}>
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {doc.items.map((it, i) => (
                    <div className="it" key={i}>
                      <input className="d" placeholder="Description" aria-label="Description" value={it.d} onChange={(e) => patchItem(i, { d: e.target.value })} />
                      <input type="number" inputMode="decimal" min="0" step="any" aria-label="Quantity" value={it.q} onChange={(e) => patchItem(i, { q: e.target.value })} />
                      <input type="number" inputMode="decimal" min="0" step="any" placeholder="Price" aria-label="Price" value={it.p} onChange={(e) => patchItem(i, { p: e.target.value })} />
                      <button className="btn g dg" onClick={() => removeItem(i)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <button className="btn" onClick={addItem}>
                    Add item
                  </button>
                  <div style={{ marginTop: 16 }}>
                    <Grid2>
                      <Field label="Discount amount" type="number" value={doc.discount} onChange={(v) => patch({ discount: v })} />
                      <SelectField label="Currency" value={doc.currency} onChange={(v) => patch({ currency: v })} options={CURRENCIES} />
                    </Grid2>
                  </div>
                  <label className="ck">
                    <input type="checkbox" checked={doc.vat} onChange={(e) => patch({ vat: e.target.checked })} /> Add VAT of {doc.vatRate}%
                  </label>
                  <TotalsBlock doc={doc} />
                </Section>

                {doc.type === 'invoice' && (
                  <Section title="Payments received">
                    <p className="mu small" style={{ marginTop: 0 }}>
                      Record a deposit or part payment here. The balance updates by itself.
                    </p>
                    {doc.payments.map((pm, i) => (
                      <div className="it pay" key={i}>
                        <input type="number" inputMode="decimal" min="0" step="any" placeholder="Amount" aria-label="Amount paid" value={pm.amt} onChange={(e) => patchPayment(i, { amt: e.target.value })} />
                        <input type="date" aria-label="Date paid" value={pm.date} onChange={(e) => patchPayment(i, { date: e.target.value })} />
                        <button className="btn g dg" onClick={() => removePayment(i)}>
                          Remove
                        </button>
                        <select className="d" aria-label="Paid by" value={pm.method} onChange={(e) => patchPayment(i, { method: e.target.value })}>
                          {PAY_METHODS.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                        <button className="btn full" onClick={() => receiptForPayment(i)}>
                          Make a receipt for this payment
                        </button>
                      </div>
                    ))}
                    <button className="btn" onClick={addPayment}>
                      Add a payment
                    </button>
                    <div className="tot">
                      <div>
                        <span>Paid so far</span>
                        <span>{money(paidOf(doc), doc.currency)}</span>
                      </div>
                      <div className="g">
                        <span>Balance left</span>
                        <span>{money(balanceOf(doc), doc.currency)}</span>
                      </div>
                    </div>
                  </Section>
                )}

                <Section title="Notes">
                  <TextArea value={doc.notes} onChange={(v) => patch({ notes: v })} placeholder="Thank you for your business." />
                  <SignatureToggle doc={doc} profile={profile} patch={patch} onSaveFirst={() => persist(doc)} />
                </Section>
              </>
            )}

            <Section title="More">
              <div className="chips">
                {doc.type === 'contract' && (
                  <button
                    className="btn"
                    onClick={() => {
                      addTemplate(doc.title || 'My template', doc.body || '')
                      toast('Saved to your templates')
                    }}
                  >
                    Save as my template
                  </button>
                )}
                {isSaved && doc.type === 'invoice' && !doc.payments.length && status !== 'paid' && (
                  <button className="btn" onClick={receiptForFull}>
                    Issue receipt for full amount
                  </button>
                )}
                {isSaved && doc.type === 'invoice' && status !== 'paid' && (
                  <button className="btn" onClick={() => setReminder(true)}>
                    Send a reminder
                  </button>
                )}
                {isSaved && (
                  <button className="btn" onClick={duplicate}>
                    Duplicate
                  </button>
                )}
                {isSaved && (
                  <button className="btn dg" onClick={remove}>
                    {armed ? 'Tap again to delete' : 'Delete'}
                  </button>
                )}
              </div>
            </Section>
          </>
        ) : (
          <>
            <LookControls style={doc.style} onChange={(p) => patch({ style: { ...doc.style, ...p } })} />
            <PaperPreview doc={doc} profile={profile} />
            <p className="mu small">To send it, download the PDF and attach it in WhatsApp or email. The WhatsApp button opens a ready message to your client.</p>
          </>
        )}
      </main>

      <div className="bar">
        {tab === 'edit' ? (
          <>
            <button className="btn p" onClick={save}>
              Save
            </button>
            <button className="btn" onClick={() => setTab('prev')}>
              Preview
            </button>
          </>
        ) : (
          <>
            <button className="btn p" onClick={download} disabled={busy}>
              Download PDF
            </button>
            <button className="btn" onClick={sendOnWhatsApp}>
              Send on WhatsApp
            </button>
          </>
        )}
      </div>

      {reminder && <ReminderModal onClose={() => setReminder(false)} onPick={sendReminder} />}
    </>
  )
}

/* ---------- small pieces ---------- */

function ClientFields({ client, patchClient }: { client: Client; patchClient: (p: Partial<Client>) => void }) {
  return (
    <>
      <Field label="Name" value={client.name} onChange={(v) => patchClient({ name: v })} placeholder="Client or company name" />
      <Grid2>
        <Field label="Email" type="email" value={client.email} onChange={(v) => patchClient({ email: v })} />
        <Field label="Phone" type="tel" value={client.phone} onChange={(v) => patchClient({ phone: v })} placeholder="0803 000 0000" />
      </Grid2>
      <Field label="Address" value={client.address} onChange={(v) => patchClient({ address: v })} />
    </>
  )
}

function TotalsBlock({ doc }: { doc: Doc }) {
  const t = totals(doc)
  const c = doc.currency
  return (
    <div className="tot">
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
        <span>{doc.type === 'receipt' ? 'Amount paid' : 'Total'}</span>
        <span>{money(t.total, c)}</span>
      </div>
    </div>
  )
}

function SignatureToggle({ doc, profile, patch, onSaveFirst }: { doc: Doc; profile: Profile; patch: (p: Partial<Doc>) => void; onSaveFirst: () => void }) {
  if (profile.signature) {
    return (
      <label className="ck">
        <input type="checkbox" checked={doc.useSig} onChange={(e) => patch({ useSig: e.target.checked })} /> Add my signature
      </label>
    )
  }
  return (
    <p className="mu small">
      No signature yet.{' '}
      <Link to="/app/profile" className="inlink" onClick={onSaveFirst}>
        Add one in Profile
      </Link>
    </p>
  )
}

function ContractForm({
  doc,
  profile,
  patch,
  patchClient,
  onSaveFirst,
}: {
  doc: Doc
  profile: Profile
  patch: (p: Partial<Doc>) => void
  patchClient: (p: Partial<Client>) => void
  onSaveFirst: () => void
}) {
  return (
    <>
      <Grid2>
        <Field label="Number" value={doc.number} onChange={(v) => patch({ number: v })} />
        <Field label="Date" type="date" value={doc.issueDate} onChange={(v) => patch({ issueDate: v })} />
      </Grid2>
      <Field label="Contract title" value={doc.title ?? ''} onChange={(v) => patch({ title: v })} />
      <SelectField
        label="Status"
        value={doc.status}
        onChange={(v) => patch({ status: v as Doc['status'] })}
        options={[
          ['draft', 'Draft'],
          ['sent', 'Sent'],
          ['signed', 'Signed'],
        ]}
      />
      <Section title="Client">
        <Field label="Name" value={doc.client.name} onChange={(v) => patchClient({ name: v })} placeholder="Client or company name" />
        <Grid2>
          <Field label="Email" type="email" value={doc.client.email} onChange={(v) => patchClient({ email: v })} />
          <Field label="Phone" type="tel" value={doc.client.phone} onChange={(v) => patchClient({ phone: v })} />
        </Grid2>
      </Section>
      <Section title="Terms">
        <Grid2>
          <Field label="Fee" type="number" value={doc.fee ?? ''} onChange={(v) => patch({ fee: v })} />
          <SelectField label="Currency" value={doc.currency} onChange={(v) => patch({ currency: v })} options={CURRENCIES} />
          <Field label="Start date" type="date" value={doc.start ?? ''} onChange={(v) => patch({ start: v })} />
          <Field label="End date" type="date" value={doc.end ?? ''} onChange={(v) => patch({ end: v })} />
        </Grid2>
        <TextArea label="Contract text" rows={18} value={doc.body ?? ''} onChange={(v) => patch({ body: v })} />
        <p className="mu small">
          Words in double curly brackets, like {'{{client}}'}, fill in by themselves from the fields above. Change the fields any time and the contract updates. Lines starting with # become
          headings. Text in square brackets is for you to fill in.
        </p>
        <p className="mu small">Templates are plain starting points, not legal advice. Have a lawyer check important agreements.</p>
        <SignatureToggle doc={doc} profile={profile} patch={patch} onSaveFirst={onSaveFirst} />
      </Section>
    </>
  )
}
