import { Modal } from './Modal'
import type { ReminderTone } from '../lib/whatsapp'

const TONES: { tone: ReminderTone; title: string; hint: string }[] = [
  { tone: 'friendly', title: 'Friendly', hint: 'A gentle nudge' },
  { tone: 'firm', title: 'Firm', hint: 'Clear that it is overdue' },
  { tone: 'final', title: 'Final notice', hint: 'Last reminder before you follow up another way' },
]

export function ReminderModal({ onClose, onPick }: { onClose: () => void; onPick: (t: ReminderTone) => void }) {
  return (
    <Modal label="Send a reminder" onClose={onClose}>
      <h3 className="s">Send a payment reminder</h3>
      <p className="mu small" style={{ marginTop: 0 }}>
        Choose a tone. WhatsApp opens with the message ready.
      </p>
      {TONES.map((t) => (
        <button key={t.tone} className="tpl" onClick={() => onPick(t.tone)}>
          <b>{t.title}</b>
          <span className="mu small">{t.hint}</span>
        </button>
      ))}
      <div className="row2">
        <button className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  )
}
