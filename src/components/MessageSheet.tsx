import { useState } from 'react'
import type { Customer, Profile } from '../lib/types'
import { readyMessages, type ReadyMessage } from '../lib/customerMessages'
import { waLink } from '../lib/whatsapp'
import { Modal } from './Modal'
import { WhatsAppIcon } from './Icons'

/** Pick a ready message for a customer, change it if you like, then open WhatsApp with it. */
export function MessageSheet({ customer, profile, owed, onClose }: { customer: Customer; profile: Profile; owed: string; onClose: () => void }) {
  const options = readyMessages(customer, profile, owed)
  const [picked, setPicked] = useState<ReadyMessage | null>(null)
  const [text, setText] = useState('')

  const pick = (m: ReadyMessage) => {
    setPicked(m)
    setText(m.text)
  }

  return (
    <Modal label={`Message ${customer.name}`} onClose={onClose}>
      {!picked ? (
        <>
          <h3 className="s">Message {customer.name.split(' ')[0]}</h3>
          <p className="mu small" style={{ marginTop: 0 }}>
            Pick a ready message. You can change the words before WhatsApp opens.
          </p>
          {options.map((m) => (
            <button key={m.id} className="tpl" onClick={() => pick(m)}>
              <b>{m.title}</b>
              <span className="mu small">{m.hint}</span>
            </button>
          ))}
          <div className="row2">
            <button className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="s">{picked.title}</h3>
          <label className="f">
            <span>Your message</span>
            <textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <div className="row2">
            <button className="btn" onClick={() => setPicked(null)}>
              Back
            </button>
            <a
              className="btn p"
              href={waLink(customer.phone, text)}
              target="_blank"
              rel="noreferrer"
              onClick={() => window.setTimeout(onClose, 300)}
            >
              <WhatsAppIcon />
              Open WhatsApp
            </a>
          </div>
        </>
      )}
    </Modal>
  )
}
