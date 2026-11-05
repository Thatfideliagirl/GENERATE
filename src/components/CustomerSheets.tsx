import { useState, type ChangeEvent } from 'react'
import type { Customer } from '../lib/types'
import { blankCustomer, canPickContacts, onlyNew, parseCustomers, pickContacts } from '../lib/customers'
import { Modal } from './Modal'
import { Field, Grid2, TextArea } from './Fields'
import { useStore } from '../data/store'
import { useToast } from './Toast'

/** Add a new customer, or change one. */
export function CustomerForm({ initial, onClose, onSaved }: { initial?: Customer; onClose: () => void; onSaved?: (c: Customer) => void }) {
  const { saveCustomers } = useStore()
  const toast = useToast()
  const [c, setC] = useState<Customer>(initial ?? blankCustomer())
  const [err, setErr] = useState('')
  const set = (p: Partial<Customer>) => {
    setC((x) => ({ ...x, ...p }))
    setErr('')
  }
  const save = () => {
    if (!c.name.trim()) return setErr('Enter the customer’s name.')
    const saved = { ...c, name: c.name.trim(), phone: c.phone.trim(), email: c.email.trim(), address: c.address.trim() }
    saveCustomers([saved])
    toast(initial ? 'Customer updated' : 'Customer added')
    onSaved?.(saved)
    onClose()
  }
  return (
    <Modal label={initial ? 'Edit customer' : 'Add a customer'} onClose={onClose}>
      <h3 className="s a-sheet-h">{initial ? 'Edit customer' : 'Add a customer'}</h3>
      <Field label="Name" value={c.name} onChange={(v) => set({ name: v })} placeholder="Person or company name" />
      <Grid2>
        <Field label="Phone or WhatsApp" type="tel" value={c.phone} onChange={(v) => set({ phone: v })} placeholder="0803 000 0000" />
        <Field label="Email" type="email" value={c.email} onChange={(v) => set({ email: v })} />
      </Grid2>
      <Field label="Address" value={c.address} onChange={(v) => set({ address: v })} />
      <TextArea label="Note (only you see this)" rows={2} value={c.note ?? ''} onChange={(v) => set({ note: v })} placeholder="For example, prefers bank transfer" />
      <p className="err" role="alert">
        {err}
      </p>
      <div className="row2">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn p" onClick={save}>
          {initial ? 'Save changes' : 'Add customer'}
        </button>
      </div>
    </Modal>
  )
}

/** Bring in many customers at once: phone contacts where the phone allows it, a CSV file, or a pasted list. */
export function ImportCustomers({ onClose }: { onClose: () => void }) {
  const { data, saveCustomers } = useStore()
  const toast = useToast()
  const [text, setText] = useState('')
  const [found, setFound] = useState<Customer[] | null>(null)

  const review = (list: Customer[]) => {
    const fresh = onlyNew(list, data.customers)
    if (!fresh.length) return toast(list.length ? 'They are all in your list already' : 'No names found. Check the list and try again.')
    setFound(fresh)
  }
  const fromFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) review(parseCustomers(await f.text()))
  }
  const fromPhone = async () => {
    try {
      review(await pickContacts())
    } catch {
      toast('Contacts could not be opened on this phone')
    }
  }
  const confirm = () => {
    if (!found) return
    saveCustomers(found)
    toast(`${found.length} ${found.length === 1 ? 'customer' : 'customers'} added`)
    onClose()
  }

  return (
    <Modal label="Import customers" onClose={onClose}>
      {found ? (
        <>
          <h3 className="s a-sheet-h">
            Add {found.length} {found.length === 1 ? 'customer' : 'customers'}?
          </h3>
          <div className="card a-list a-importlist">
            {found.slice(0, 60).map((c) => (
              <div key={c.id} className="a-cusmini">
                <b>{c.name}</b>
                <span className="mu small">{[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact details'}</span>
              </div>
            ))}
          </div>
          {found.length > 60 && <p className="mu small">And {found.length - 60} more.</p>}
          <div className="row2">
            <button className="btn" onClick={() => setFound(null)}>
              Back
            </button>
            <button className="btn p" onClick={confirm}>
              Add them
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="s a-sheet-h">Import customers</h3>
          <div className="a-make">
            {canPickContacts() && (
              <button onClick={fromPhone}>
                <span className="a-ico">☎</span>
                <span>
                  <b>From your phone contacts</b>
                  <small>Pick the people you work for</small>
                </span>
              </button>
            )}
            <label className="a-filepick">
              <span className="a-ico">⇪</span>
              <span>
                <b>From a file</b>
                <small>A CSV or text file with a name on each line</small>
              </span>
              <input type="file" accept=".csv,.txt,text/csv,text/plain" hidden onChange={fromFile} />
            </label>
          </div>
          <TextArea
            label="Or paste a list, one customer per line"
            rows={5}
            value={text}
            onChange={setText}
            placeholder={'Tunde Bello, 0809 999 8888\nChioma Eze, chioma@mail.com'}
          />
          <div className="row2">
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn p" disabled={!text.trim()} onClick={() => review(parseCustomers(text))}>
              Read the list
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

/** Pick who a document is for from the saved customers. */
export function PickCustomer({ onClose, onPick, onNew }: { onClose: () => void; onPick: (c: Customer) => void; onNew: () => void }) {
  const { data } = useStore()
  const [q, setQ] = useState('')
  const list = data.customers.filter((c) => `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Modal label="Choose a customer" onClose={onClose}>
      <h3 className="s a-sheet-h">Who is this for?</h3>
      <input type="search" placeholder="Search your customers" aria-label="Search your customers" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card a-list a-picklist">
        {list.length ? (
          list.map((c) => (
            <button key={c.id} className="row" onClick={() => onPick(c)}>
              <span className="l">
                <span className="a-av">{c.name.slice(0, 1).toUpperCase()}</span>
                <span>
                  <b>{c.name}</b>
                  <span className="mu small">{c.phone || c.email || 'No contact details'}</span>
                </span>
              </span>
            </button>
          ))
        ) : (
          <div className="empty">
            <b>No customers found</b>Add them here and pick them next time.
          </div>
        )}
      </div>
      <div className="row2">
        <button className="btn" onClick={onClose}>
          Close
        </button>
        <button className="btn p" onClick={onNew}>
          New customer
        </button>
      </div>
    </Modal>
  )
}
