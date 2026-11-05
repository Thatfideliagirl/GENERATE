/**
 * Signed documents are kept on this device in the browser's own database (IndexedDB), so a person can open the list
 * and download a signed copy again later. PDF files are too big for the normal saved data, and nothing is uploaded.
 */
export interface SignedRecord {
  id: string
  userId: string
  name: string
  pages: number
  size: number
  createdAt: number
}

interface Stored extends SignedRecord {
  blob: Blob
}

const DB = 'generate'
const STORE = 'signed'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }).createIndex('userId', 'userId')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = work(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveSigned(rec: SignedRecord, blob: Blob): Promise<void> {
  await run('readwrite', (s) => s.put({ ...rec, blob } as Stored))
}

/** The person's signed documents, newest first, without the files. */
export async function listSigned(userId: string): Promise<SignedRecord[]> {
  try {
    const all = (await run('readonly', (s) => s.index('userId').getAll(userId))) as Stored[]
    return all.map(({ blob: _b, ...r }) => (void _b, r)).sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

export async function getSignedFile(id: string): Promise<Blob | null> {
  const r = (await run('readonly', (s) => s.get(id))) as Stored | undefined
  return r?.blob ?? null
}

export async function deleteSigned(id: string): Promise<void> {
  await run('readwrite', (s) => s.delete(id))
}
