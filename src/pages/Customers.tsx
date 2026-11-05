import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { Doc, Profile } from '../lib/types'
import { DOC_LABEL, STATUS_LABEL } from '../lib/constants'
import { balanceOf, statusOf, totals } from '../lib/calc'
import { fmtDate, money } from '../lib/format'
import { docsFor, initialsOfName } from '../lib/customers'
import { waLink } from '../lib/whatsapp'
import { PageHeader } from '../components/TopBar'
import { CustomerForm, ImportCustomers } from '../components/CustomerSheets'
import { EditIcon, InvoiceIcon, PeopleIcon, PlusIcon, ReceiptIcon, TrashIcon, WhatsAppIcon } from '../components/Icons'
import { useStore } from '../data/store'
import { useToast } from '../components/Toast'

/** Money still owed by a customer, grouped by currency. */
function owedBy(docs: Doc[]) {
  const m: Record<string, number> = {}
  for (const d of docs) {
    if (d.type !== 'invoice') continue
    const st = statusOf(d)
    if (st === 'sent' || st === 'part' || st === 'overdue') m[d.currency] = (m[d.currency] || 0) + balanceOf(d)
  }
  return m
}

const fmtMap = (m: Record<string, number>) =>
  Object.entries(m)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => money(v, k))
    .join(' · ')

export function CustomersPage() {
  const nav = useNavigate()
  const { data } = useStore()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)

  const rows = useMemo(() => {
    const s = q.toLowerCase()
    return data.customers
      .filter((c) => !s || `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(s))
      .map((c) => {
        const docs = docsFor(c, data.docs)
        return { c, count: docs.length, owed: fmtMap(owedBy(docs)) }
      })
  }, [data.customers, data.docs, q])

  return (
    <>
      <PageHeader title="Customers" onBack={() => nav('/app')} />
      <main className="wrap">
        <div className="a-pagehead">
          <div>
            <h1>
              Your <em>customers</em>
            </h1>
            <p className="mu">Save the people you work for once. When you make a document, pick them and their details fill in.</p>
          </div>
          <div className="a-headbtns">
            <button className="btn" onClick={() => setImporting(true)}>
              Import
            </button>
            <button className="btn p" onClick={() => setAdding(true)}>
              <PlusIcon />
              Add customer
            </button>
          </div>
        </div>

        {data.customers.length ? (
          <>
            <input type="search" className="a-search" placeholder="Search by name, phone or email" aria-label="Search your customers" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="card a-list">
              {rows.length ? (
                rows.map(({ c, count, owed }) => (
                  <button key={c.id} className="row" onClick={() => nav('/app/customers/' + c.id)}>
                    <span className="l">
                      <span className="a-av">{initialsOfName(c.name)}</span>
                      <span>
                        <b>{c.name}</b>
                        <span className="mu small">{c.phone || c.email || 'No contact details yet'}</span>
                      </span>
                    </span>
                    <span className="r">
                      {owed ? <b className="a-owed">{owed} owed</b> : null}
                      <span className="mu small">
                        {count} {count === 1 ? 'document' : 'documents'}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="empty">
                  <b>No matches</b>Try another name or number.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card a-first">
            <span className="a-bigico">
              <PeopleIcon />
            </span>
            <h3>
              Keep your customers in <em>one place.</em>
            </h3>
            <p className="mu">Add them one by one, or import a list from your phone or a file. You can also add someone straight from an invoice.</p>
            <div className="a-headbtns">
              <button className="btn" onClick={() => setImporting(true)}>
                Import a list
              </button>
              <button className="btn p" onClick={() => setAdding(true)}>
                Add a customer
              </button>
            </div>
          </div>
        )}
      </main>
      {adding && <CustomerForm onClose={() => setAdding(false)} />}
      {importing && <ImportCustomers onClose={() => setImporting(false)} />}
    </>
  )
}

/** One customer: their details, what they owe, and every document made for them. */
export function CustomerPage({ profile }: { profile: Profile }) {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { data, deleteCustomer } = useStore()
  const [editing, setEditing] = useState(false)
  const [armed, setArmed] = useState(false)
  const c = data.customers.find((x) => x.id === id)
  const docs = useMemo(() => (c ? docsFor(c, data.docs).sort((a, b) => b.updatedAt - a.updatedAt) : []), [c, data.docs])
  if (!c) return <Navigate to="/app/customers" replace />

  const owed = fmtMap(owedBy(docs))
  const billed: Record<string, number> = {}
  for (const d of docs) if (d.type === 'invoice') billed[d.currency] = (billed[d.currency] || 0) + totals(d).total

  const remove = () => {
    if (!armed) {
      setArmed(true)
      window.setTimeout(() => setArmed(false), 3500)
      return
    }
    deleteCustomer(c.id)
    toast('Customer removed. Their documents are kept.')
    nav('/app/customers', { replace: true })
  }

  return (
    <>
      <PageHeader
        title={c.name}
        onBack={() => nav('/app/customers')}
        right={
          <button className="back" onClick={() => setEditing(true)}>
            <EditIcon />
            Edit
          </button>
        }
      />
      <main className="wrap">
        <section className="card a-cushead">
          <span className="a-av big">{initialsOfName(c.name)}</span>
          <div>
            <h1>{c.name}</h1>
            <p className="mu">{[c.phone, c.email, c.address].filter(Boolean).join(' · ') || 'No contact details yet. Tap Edit to add them.'}</p>
            {c.note && <p className="a-cusnote">{c.note}</p>}
          </div>
          <div className="a-cusstats">
            <div>
              <span>Still owed</span>
              <b className="num">{owed || money(0, profile.currency)}</b>
            </div>
            <div>
              <span>Billed in total</span>
              <b className="num">{fmtMap(billed) || money(0, profile.currency)}</b>
            </div>
            <div>
              <span>Documents</span>
              <b className="num">{docs.length}</b>
            </div>
          </div>
          <div className="a-headbtns">
            <button className="btn p" onClick={() => nav('/app/new/invoice?customer=' + c.id)}>
              <InvoiceIcon />
              New invoice
            </button>
            <button className="btn" onClick={() => nav('/app/new/receipt?customer=' + c.id)}>
              <ReceiptIcon />
              New receipt
            </button>
            {c.phone && (
              <a className="btn" href={waLink(c.phone, `Hello ${c.name.split(' ')[0]}, `)} target="_blank" rel="noreferrer">
                <WhatsAppIcon />
                WhatsApp
              </a>
            )}
          </div>
        </section>

        <div className="a-head">
          <h2>Their documents</h2>
        </div>
        <div className="card a-list">
          {docs.length ? (
            docs.map((d) => {
              const st = statusOf(d)
              return (
                <button key={d.id} className="row" onClick={() => nav('/app/doc/' + d.id)}>
                  <span className="l">
                    <span>
                      <b>
                        {DOC_LABEL[d.type]} {d.number}
                      </b>
                      <span className="mu small">{fmtDate(d.issueDate)}</span>
                    </span>
                  </span>
                  <span className="r">
                    <b>{d.type === 'contract' ? (d.fee ? money(d.fee, d.currency) : '') : money(totals(d).total, d.currency)}</b>
                    <span className={'bd ' + st}>{STATUS_LABEL[st]}</span>
                  </span>
                </button>
              )
            })
          ) : (
            <div className="empty">
              <b>Nothing yet</b>Invoices, receipts and contracts you make for {c.name.split(' ')[0]} will show here.
            </div>
          )}
        </div>
        <button className="btn g dg a-del" onClick={remove}>
          <TrashIcon />
          {armed ? 'Tap again to remove' : 'Remove this customer'}
        </button>
      </main>
      {editing && <CustomerForm initial={c} onClose={() => setEditing(false)} />}
    </>
  )
}
