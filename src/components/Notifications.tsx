import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Profile } from '../lib/types'
import { markSeen, notesFor, seenSet, type NoteKind } from '../lib/notifications'
import { useStore } from '../data/store'
import { useAuth } from '../data/session'
import { Modal } from './Modal'
import { BellIcon } from './Icons'

const DOT: Record<NoteKind, string> = { late: 'late', soon: 'soon', draft: 'draft', setup: 'setup', welcome: 'setup', ask: 'soon' }

/** The bell: a count of new notifications, and the list when tapped. Opening it marks them as seen. */
export function NotificationBell({ profile }: { profile: Profile }) {
  const { data } = useStore()
  const { session } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(() => (session ? seenSet(session.userId) : new Set<string>()))
  const notes = useMemo(() => notesFor(data.docs, profile), [data.docs, profile])
  const unread = notes.filter((n) => !seen.has(n.id)).length

  const show = () => {
    setOpen(true)
  }
  const close = () => {
    if (session) {
      markSeen(session.userId, notes.map((n) => n.id))
      setSeen(seenSet(session.userId))
    }
    setOpen(false)
  }

  return (
    <>
      <button className="a-theme a-bell" onClick={show} aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'} title="Notifications">
        <BellIcon />
        {unread > 0 && <span className="a-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <Modal label="Notifications" onClose={close}>
          <div className="a-noteshead">
            <h3 className="s a-sheet-h">Notifications</h3>
            {unread > 0 && <span className="mu small">{unread} new</span>}
          </div>
          {notes.length ? (
            <div className="a-notes">
              {notes.map((n) => (
                <button
                  key={n.id}
                  className={'a-note' + (seen.has(n.id) ? '' : ' new')}
                  onClick={() => {
                    close()
                    nav(n.to)
                  }}
                >
                  <span className={'a-notedot ' + DOT[n.kind]} aria-hidden="true" />
                  <span>
                    <b>{n.title}</b>
                    <small>{n.text}</small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">
              <b>You are all caught up</b>Late invoices, payments due soon and drafts you forgot will show here.
            </div>
          )}
          <div className="row2">
            <button className="btn" onClick={close}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
