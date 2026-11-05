import { useEffect, useRef, useState } from 'react'
import { useWide } from '../components/useWide'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Client, Customer, Doc, DocType, Item, Payment, Profile } from '../lib/types'
import { CURRENCIES, DOC_LABEL, PAY_METHODS, STATUS_LABEL, TRADE_ITEMS, TRADES } from '../lib/constants'
import { balanceOf, paidOf, statusOf, totals } from '../lib/calc'
import { clone, money, today, uid } from '../lib/format'
import { newDoc } from '../lib/factory'
import { socialLines } from '../lib/social'
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
import { clientFromCustomer, customerFromClient, findCustomer } from '../lib/customers'
import { CustomerForm, PickCustomer } from '../components/CustomerSheets'
import { Modal } from '../components/Modal'
import { PeopleIcon, WhatsAppIcon } from '../components/Icons'
import { payLink, signLink } from '../lib/links'

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
    const d = newDoc(type as DocType, profile, nextNo(type as DocType), tpl)
    const cus = data.customers.find((c) => c.id === search.get('customer'))
    return cus ? { ...d, client: clientFromCustomer(cus), customerId: cus.id } : d
  })
  if (!initial) return <Navigate to="/app" replace />
  return <Editor key={`${type}-${templateId}`} initial={initial} profile={profile} />
}

/* ---------- the editor ---------- */

/** Client names already asked about in this visit, so the add to customers question is not repeated. */
const ASKED = new Set<string>()

function Editor({ initial, profile }: { initial: Doc; profile: Profile }) {
  const nav = useNavigate()
  const toast = useToast()
  const { data, saveDoc, deleteDoc, addTemplate, nextNo, saveCustomers } = useStore()
  const [picking, setPicking] = useState(false)
  const [newCus, setNewCus] = useState(false)
  // A new document opens again under its own address once saved, so the question about the customer travels with it.
  const { state } = useLocation() as { state: { askAdd?: Customer } | null }
  const [askAdd, setAskAdd] = useState<Customer | null>(state?.askAdd ?? null)
  const [share, setShare] = useState<{ kind: 'pay' | 'sign'; link: string } | null>(null)
  const [doc, setDoc] = useState<Doc>(initial)
  const [tab, setTab] = useState<'edit' | 'prev'>('edit')
  const [reminder, setReminder] = useState(false)
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const armTimer = useRef<number>()
  // On a wide screen the preview sits beside the form, so there is no tab to switch.
  const wide = useWide(1180)
  const view = wide ? 'edit' : tab

  const isSaved = data.docs.some((d) => d.id === doc.id)
  const status = statusOf(doc)

  useEffect(() => () => window.clearTimeout(armTimer.current), [])
  useEffect(() => {
    // Ask once: clear the question from the page history so a reload does not bring it back.
    if (state?.askAdd) {
      ASKED.add(state.askAdd.name.toLowerCase())
      nav('.', { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  const patch = (p: Partial<Doc>) => setDoc((d) => ({ ...d, ...p }))
  const patchClient = (p: Partial<Client>) =>
    setDoc((d) => ({ ...d, client: { ...d.client, ...p }, customerId: p.name !== undefined && d.customerId ? undefined : d.customerId }))
  const patchItem = (i: number, p: Partial<Item>) =>
    setDoc((d) => ({ ...d, items: d.items.map((it, k) => (k === i ? { ...it, ...p } : it)) }))
  const patchPayment = (i: number, p: Partial<Payment>) =>
    setDoc((d) => ({ ...d, payments: d.payments.map((x, k) => (k === i ? { ...x, ...p } : x)) }))

  const isEmpty = !isSaved && !doc.client.name && doc.type !== 'contract' && !doc.items.some((i) => i.d || i.p)

  const persist = (d: Doc, ask?: Customer | null) => {
    saveDoc(d)
    if (!isSaved) nav(`/app/doc/${d.id}`, { replace: true, state: ask ? { askAdd: ask } : null })
    else if (ask) setAskAdd(ask)
  }

  // After saving, offer to keep a new client in the customers list. Asked once per name in a visit.
  const askFor = (d: Doc): Customer | null => {
    const name = d.client.name.trim()
    if (!name) return null
    if (d.customerId && data.customers.some((c) => c.id === d.customerId)) return null
    if (findCustomer(data.customers, name) || ASKED.has(name.toLowerCase())) return null
    ASKED.add(name.toLowerCase())
    return customerFromClient(d.client)
  }
  const maybeAsk = (d: Doc) => {
    const c = askFor(d)
    if (c) setAskAdd(c)
  }

  const save = () => {
    persist(doc, askFor(doc))
    toast('Saved')
  }

  // A pay link (invoices) or a signing link (contracts) the client opens without an account.
  const makeLink = async (kind: 'pay' | 'sign') => {
    if (kind === 'pay' && !profile.bank.acct) return toast('Add your bank details in Profile first, so your client knows where to pay')
    if (kind === 'sign' && !doc.body?.trim()) return toast('Write the contract first')
    const d = markSent()
    setDoc(d)
    persist(d)
    setShare({ kind, link: kind === 'pay' ? await payLink(d, profile) : await signLink(d, profile) })
  }

  const linkCard =
    isSaved && doc.type === 'invoice' && status !== 'paid' ? (
      <div className="sec a-linkcard">
        <h3 className="s">Get paid faster</h3>
        <p className="mu small">Send a pay link. Your client sees the amount, what is left and your bank details with a copy button, then taps "I have paid".</p>
        <button className="btn p" onClick={() => makeLink('pay')}>
          Send pay link
        </button>
      </div>
    ) : isSaved && doc.type === 'contract' && status !== 'signed' ? (
      <div className="sec a-linkcard">
        <h3 className="s">Get it signed</h3>
        <p className="mu small">Send a signing link. Your client reads the contract on their phone, signs, and sends it back to you on WhatsApp. No account needed.</p>
        <button className="btn p" onClick={() => makeLink('sign')}>
          Send to sign
        </button>
      </div>
    ) : doc.type === 'contract' && doc.clientSignedAt ? (
      <div className="sec a-linkcard">
        <h3 className="s">Signed by {doc.clientSignedName || doc.client.name}</h3>
        <p className="mu small">On {new Date(doc.clientSignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}. Their signature is on the contract. Download the PDF to keep a copy.</p>
      </div>
    ) : null

  const chooseCustomer = (c: Customer) => {
    patch({ client: clientFromCustomer(c), customerId: c.id })
    setPicking(false)
    toast(c.name + ' added to this ' + DOC_LABEL[doc.type].toLowerCase())
  }

  const picker = (
    <div className="a-cuspick">
      {doc.customerId && data.customers.some((c) => c.id === doc.customerId) ? (
        <span className="a-cusbadge">
          <PeopleIcon />
          From your customers
        </span>
      ) : (
        <span className="mu small">Type the details, or pick someone you saved.</span>
      )}
      <button type="button" className="btn a-pickbtn" onClick={() => setPicking(true)}>
        <PeopleIcon />
        Choose from customers
      </button>
    </div>
  )

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
      showSocials: doc.showSocials,
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
      showSocials: doc.showSocials,
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
      <PageHeader title={`${DOC_LABEL[doc.type]} ${doc.number}`} onBack={back} right={<span className={'bd ' + status}>{STATUS_LABEL[status]}</span>} />
      <main className="wrap a-ed">
        <div className="seg a-tabsw">
          <button className={tab === 'edit' ? 'on' : ''} onClick={() => setTab('edit')}>
            Details
          </button>
          <button className={tab === 'prev' ? 'on' : ''} onClick={() => setTab('prev')}>
            Preview
          </button>
        </div>

        <div className="a-split">
        <div>
        {view === 'edit' ? (
          <>
            {doc.type === 'contract' ? (
              <ContractForm doc={doc} profile={profile} patch={patch} patchClient={patchClient} onSaveFirst={() => persist(doc)} picker={picker} />
            ) : (
              <>
                <Section title="Details">
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
                </Section>

                <Section title={doc.type === 'receipt' ? 'Received from' : 'Billed to'}>
                  {picker}
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
                  <SocialsToggle doc={doc} profile={profile} patch={patch} />
                </Section>
              </>
            )}

            {linkCard}
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
            <PaperPreview doc={doc} profile={profile} />
            <details className="sec a-looks">
              <summary>Change the look</summary>
              <LookControls style={doc.style} onChange={(p) => patch({ style: { ...doc.style, ...p } })} />
            </details>
            <p className="mu small">Download the PDF to attach it anywhere, or tap Send on WhatsApp to open a ready message to your client.</p>
          </>
        )}
        </div>
        {wide && (
          <aside className="a-live" aria-label="Live preview">
            <div className="a-live-h">
              <span>Live preview</span>
              <span>Updates as you type</span>
            </div>
            <details className="sec a-looks">
              <summary>Change the look</summary>
              <LookControls style={doc.style} onChange={(p) => patch({ style: { ...doc.style, ...p } })} />
            </details>
            <PaperPreview doc={doc} profile={profile} />
          </aside>
        )}
        </div>
      </main>

      <div className="bar">
        {wide ? (
          <>
            <button className="btn" onClick={save}>
              Save
            </button>
            <button className="btn p" onClick={download} disabled={busy}>
              Download PDF
            </button>
            <button className="btn wa" onClick={sendOnWhatsApp}>
              Send on WhatsApp
            </button>
          </>
        ) : tab === 'edit' ? (
          <>
            <button className="btn" onClick={save}>
              Save
            </button>
            <button
              className="btn p"
              onClick={() => {
                setTab('prev')
                maybeAsk(doc)
              }}
            >
              Preview
            </button>
          </>
        ) : (
          <>
            <button className="btn p" onClick={download} disabled={busy}>
              Download PDF
            </button>
            <button className="btn wa" onClick={sendOnWhatsApp}>
              Send on WhatsApp
            </button>
          </>
        )}
      </div>

      {reminder && <ReminderModal onClose={() => setReminder(false)} onPick={sendReminder} />}
      {share && (
        <Modal label={share.kind === 'pay' ? 'Pay link' : 'Signing link'} onClose={() => setShare(null)}>
          <h3 className="s a-sheet-h">{share.kind === 'pay' ? 'Your pay link is ready' : 'Your signing link is ready'}</h3>
          <p className="mu" style={{ marginTop: 0 }}>
            {share.kind === 'pay'
              ? `${doc.client.name || 'Your client'} opens it on their phone and sees what to pay and your bank details. No account needed.`
              : `${doc.client.name || 'Your client'} opens it, reads, signs and sends it back to you on WhatsApp. Their signature then appears on your copy.`}
          </p>
          <div className="a-linkbox">{share.link}</div>
          <div className="row2">
            <button
              className="btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(share.link)
                  toast('Link copied')
                } catch {
                  toast('Could not copy. Press and hold the link to copy it.')
                }
              }}
            >
              Copy link
            </button>
            <button
              className="btn wa"
              onClick={() => {
                const who = doc.client.name ? `Hello ${doc.client.name}` : 'Hello'
                const msg =
                  share.kind === 'pay'
                    ? `${who}, here is your invoice ${doc.number} from ${profile.name}. You can see the amount and our bank details here: ${share.link} Thank you.`
                    : `${who}, here is the ${doc.title || 'contract'} from ${profile.name}. Please read and sign it here: ${share.link} Thank you.`
                window.open(waLink(doc.client.phone, msg), '_blank')
              }}
            >
              <WhatsAppIcon />
              Send on WhatsApp
            </button>
          </div>
        </Modal>
      )}
      {picking && (
        <PickCustomer
          onClose={() => setPicking(false)}
          onPick={chooseCustomer}
          onNew={() => {
            setPicking(false)
            setNewCus(true)
          }}
        />
      )}
      {newCus && <CustomerForm onClose={() => setNewCus(false)} onSaved={chooseCustomer} />}
      {askAdd && (
        <Modal label="Add to your customers" onClose={() => setAskAdd(null)}>
          <h3 className="s a-sheet-h">Add {askAdd.name} to your customers?</h3>
          <p className="mu" style={{ marginTop: 0 }}>
            Next time, pick {askAdd.name.split(' ')[0]} from your list and the details fill in by themselves.
          </p>
          <div className="row2">
            <button className="btn" onClick={() => setAskAdd(null)}>
              Not now
            </button>
            <button
              className="btn p"
              onClick={() => {
                saveCustomers([askAdd])
                const d = { ...doc, customerId: askAdd.id }
                setDoc(d)
                if (isSaved || data.docs.some((x) => x.id === d.id)) saveDoc(d)
                setAskAdd(null)
                toast('Added to your customers')
              }}
            >
              Add to customers
            </button>
          </div>
        </Modal>
      )}
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

function SocialsToggle({ doc, profile, patch }: { doc: Doc; profile: Profile; patch: (p: Partial<Doc>) => void }) {
  const lines = socialLines(profile)
  if (!lines.length) {
    return (
      <p className="mu small">
        Add your Instagram, Twitter or TikTok in your profile to print them at the bottom of documents.
      </p>
    )
  }
  return (
    <label className="ck">
      <input type="checkbox" checked={!!doc.showSocials} onChange={(e) => patch({ showSocials: e.target.checked })} /> Show my social media at the bottom
    </label>
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
  picker,
}: {
  doc: Doc
  profile: Profile
  patch: (p: Partial<Doc>) => void
  patchClient: (p: Partial<Client>) => void
  onSaveFirst: () => void
  picker: JSX.Element
}) {
  return (
    <>
      <Section title="Details">
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
      </Section>
      <Section title="Client">
        {picker}
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
        <SocialsToggle doc={doc} profile={profile} patch={patch} />
      </Section>
    </>
  )
}
