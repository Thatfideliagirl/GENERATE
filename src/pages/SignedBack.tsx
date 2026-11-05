import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { SignedBack as Back } from '../lib/links'
import { unpack } from '../lib/share'
import { useStore } from '../data/store'
import { useToast } from '../components/Toast'
import { PageHeader } from '../components/TopBar'

/** Opened by the business from the client's WhatsApp message: adds the client's signature and marks the contract signed. */
export default function SignedBackPage() {
  const { code = '' } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { data, saveDoc } = useStore()
  const [state, setState] = useState<'working' | 'missing' | 'bad'>('working')

  useEffect(() => {
    unpack<Back>(code).then((b) => {
      if (!b || !b.id || !b.sig) return setState('bad')
      const doc = data.docs.find((x) => x.id === b.id)
      if (!doc) return setState('missing')
      saveDoc({ ...doc, status: 'signed', clientSig: b.sig, clientSignedName: b.name, clientSignedAt: b.at })
      toast(`${b.name || 'Your client'} signed. Saved to the contract.`)
      nav(`/app/doc/${doc.id}`, { replace: true })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  return (
    <>
      <PageHeader title="Signed contract" onBack={() => nav('/app')} />
      <main className="wrap">
        {state === 'working' && <p className="mu">Adding the signature</p>}
        {state === 'missing' && (
          <div className="card empty">
            <b>This contract is not on this device</b>Open the link on the phone or laptop where you made the contract.
            <p>
              <Link className="btn" to="/app/contracts">
                See my contracts
              </Link>
            </p>
          </div>
        )}
        {state === 'bad' && (
          <div className="card empty">
            <b>This link does not open</b>Ask your client to send it again.
          </div>
        )}
      </main>
    </>
  )
}
