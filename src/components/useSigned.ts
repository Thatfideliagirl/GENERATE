import { useCallback, useEffect, useState } from 'react'
import { listSigned, type SignedRecord } from '../lib/signedStore'
import { useAuth } from '../data/session'

/** The signed documents kept on this device for the person signed in. */
export function useSigned() {
  const { session } = useAuth()
  const [list, setList] = useState<SignedRecord[]>([])
  const reload = useCallback(() => {
    if (session) listSigned(session.userId).then(setList)
  }, [session])
  useEffect(reload, [reload])
  return { signed: list, reload }
}
