import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppData, Doc, DocType, Profile } from '../lib/types'
import { emptyData, nextNumber } from '../lib/factory'
import { clone } from '../lib/format'
import { normalise, repo } from './repo'
import { useToast } from '../components/Toast'
import { useAuth } from './session'

interface Store {
  ready: boolean
  data: AppData
  saveProfile: (p: Profile) => void
  saveDoc: (d: Doc) => void
  deleteDoc: (id: string) => void
  addTemplate: (title: string, body: string) => void
  restore: (raw: unknown) => boolean
  /** The next free number for a new invoice, receipt or contract. */
  nextNo: (type: DocType) => string
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const { ready: authReady, session } = useAuth()
  const userId = session?.userId ?? null
  const uid = useRef<string | null>(null)
  const [data, setData] = useState<AppData>(emptyData())
  const [ready, setReady] = useState(false)
  const ref = useRef(data)

  useEffect(() => {
    if (!authReady) return
    let live = true
    uid.current = userId
    repo.load(userId).then((d) => {
      if (!live) return
      ref.current = d
      setData(d)
      setReady(true)
    })
    return () => {
      live = false
    }
  }, [authReady, userId])

  const commit = useCallback(
    (next: AppData) => {
      ref.current = next
      setData(next)
      repo.save(next, uid.current).catch(() => toast('Could not save on this device. Download a backup from Profile.'))
    },
    [toast],
  )

  const saveProfile = useCallback((p: Profile) => commit({ ...ref.current, profile: clone(p) }), [commit])

  const saveDoc = useCallback(
    (d: Doc) => {
      const cur = ref.current
      const doc = { ...clone(d), updatedAt: Date.now() }
      const exists = cur.docs.some((x) => x.id === doc.id)
      const docs = exists ? cur.docs.map((x) => (x.id === doc.id ? doc : x)) : [doc, ...cur.docs]
      const n = parseInt(doc.number, 10)
      const seq = { ...cur.seq }
      if (!exists) seq[doc.type] = Math.max(seq[doc.type] || 0, isNaN(n) ? (seq[doc.type] || 0) + 1 : n)
      commit({ ...cur, docs, seq })
    },
    [commit],
  )

  const deleteDoc = useCallback(
    (id: string) => commit({ ...ref.current, docs: ref.current.docs.filter((d) => d.id !== id) }),
    [commit],
  )

  const addTemplate = useCallback(
    (title: string, body: string) =>
      commit({
        ...ref.current,
        templates: [...ref.current.templates, { id: 'm' + Date.now().toString(36), title, body }],
      }),
    [commit],
  )

  const restore = useCallback(
    (raw: unknown) => {
      const j = raw as Partial<AppData> | null
      if (!j || !Array.isArray(j.docs) || !j.profile) return false
      commit(normalise(j))
      return true
    },
    [commit],
  )

  const nextNo = useCallback((type: DocType) => nextNumber(ref.current, type), [])

  const value = useMemo(
    () => ({ ready, data, saveProfile, saveDoc, deleteDoc, addTemplate, restore, nextNo }),
    [ready, data, saveProfile, saveDoc, deleteDoc, addTemplate, restore, nextNo],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}
