import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { ContractData, SignedBack } from '../lib/links'
import { appLink, pack, unpack } from '../lib/share'
import { toBlocks } from '../lib/text'
import { fmtDate } from '../lib/format'
import { waLink } from '../lib/whatsapp'
import { defaultProfile, newDoc } from '../lib/factory'
import { makePdf, pdfName, saveFile } from '../lib/pdf'
import { initialsOf } from '../lib/initials'
import { DrawSignatureModal, TypeSignatureModal } from '../components/SignatureModals'
import { DownloadIcon, WhatsAppIcon } from '../components/Icons'
import { useToast } from '../components/Toast'

/** Makes the signature small enough to travel back in a link: smaller, and pure ink on clear, which squeezes very well. */
function shrink(src: string, w = 240): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, w / img.width)
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0, c.width, c.height)
      const px = ctx.getImageData(0, 0, c.width, c.height)
      const a = px.data
      for (let i = 0; i < a.length; i += 4) {
        const dark = a[i + 3] > 60 && a[i] + a[i + 1] + a[i + 2] < 600
        a[i] = 19
        a[i + 1] = 32
        a[i + 2] = 58
        a[i + 3] = dark ? 255 : 0
      }
      ctx.putImageData(px, 0, 0)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = () => resolve(src)
    img.src = src
  })
}

/** The page a client opens from a contract link: read, sign, download, and send it back. No account needed. */
export default function SignContract() {
  const { code = '' } = useParams()
  const toast = useToast()
  const [d, setD] = useState<ContractData | null | undefined>(undefined)
  const [name, setName] = useState('')
  const [sig, setSig] = useState('')
  const [modal, setModal] = useState<'draw' | 'type' | null>(null)
  const [agree, setAgree] = useState(false)
  const [signedAt, setSignedAt] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    unpack<ContractData>(code).then((x) => {
      setD(x)
      if (x?.cl) setName(x.cl)
    })
  }, [code])

  const blocks = useMemo(() => (d ? toBlocks(d.body) : []), [d])

  if (d === undefined) return <div className="pp" />
  if (!d)
    return (
      <div className="pp">
        <main className="pp-card">
          <h1>This link does not open</h1>
          <p className="mu">Ask the business to send it again.</p>
        </main>
      </div>
    )

  const finish = () => {
    if (!name.trim()) return toast('Type your full name')
    if (!sig) return toast('Add your signature first')
    if (!agree) return toast('Tick the box to say you agree')
    setSignedAt(Date.now())
    window.scrollTo(0, 0)
  }

  // A full copy of the contract as a PDF, with the client's signature, made on this phone.
  const download = async () => {
    setBusy(true)
    try {
      const prof = { ...defaultProfile(), name: d.biz, owner: d.owner, phone: d.phone }
      const doc = {
        ...newDoc('contract', prof, d.n),
        number: d.n,
        title: d.title,
        body: d.body,
        issueDate: d.date,
        status: 'signed' as const,
        client: { name: name.trim(), email: '', phone: '', address: '' },
        clientSig: sig,
        clientSignedName: name.trim(),
        clientSignedAt: signedAt,
      }
      saveFile(pdfName(doc), await makePdf(doc, prof))
    } catch {
      toast('Could not make the PDF. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const sendBack = async () => {
    const back: SignedBack = { v: 1, id: d.id, name: name.trim(), sig: await shrink(sig), at: signedAt }
    const link = appLink('/app/signed-back/' + (await pack(back)))
    const msg = `Hello ${d.owner}, I have signed "${d.title}". Open this link to add my signature to your copy: ${link}`
    window.open(waLink(d.phone, msg), '_blank')
  }

  if (signedAt)
    return (
      <div className="pp">
        <main className="pp-card pp-done">
          <span className="pp-tick" aria-hidden="true">
            ✓
          </span>
          <h1>Signed. Thank you, {name.split(' ')[0]}.</h1>
          <p className="mu">
            You signed "{d.title}" with {d.biz} on {fmtDate(new Date(signedAt).toISOString().slice(0, 10))}. Download your copy, then send it back so {d.owner} has it too.
          </p>
          <button className="btn p full" onClick={download} disabled={busy}>
            <DownloadIcon />
            {busy ? 'Preparing' : 'Download my signed copy'}
          </button>
          {d.phone && (
            <button className="btn wa full" onClick={sendBack}>
              <WhatsAppIcon />
              Send it back to {d.biz}
            </button>
          )}
        </main>
        <a className="pp-made" href="#/">
          Made with <b>Generate</b>
        </a>
      </div>
    )

  return (
    <div className="pp">
      <main className="pp-card pp-contract">
        <div className="pp-biz">
          <span className="mono" style={{ width: 44, height: 44, fontSize: 16, borderRadius: 13 }}>
            {initialsOf(d.biz)}
          </span>
          <span>
            <b>{d.biz}</b>
            <small>
              Contract {d.n} · {fmtDate(d.date)}
            </small>
          </span>
        </div>
        <h1>{d.title}</h1>
        <p className="mu">Please read it through. When you are happy, sign at the bottom.</p>
        <article className="pp-text">
          {blocks.map((b, i) =>
            b.kind === 'heading' ? (
              <h3 key={i}>{b.text}</h3>
            ) : (
              <p key={i}>
                {b.lines.map((l, j) => (
                  <span key={j}>
                    {l}
                    {j < b.lines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            ),
          )}
        </article>

        <section className="pp-sign" aria-label="Sign">
          <h2>Your signature</h2>
          <label className="f">
            <span>Your full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <div className="pp-sigbox">{sig ? <img src={sig} alt="Your signature" /> : <span className="mu small">No signature yet</span>}</div>
          <div className="chips">
            <button className="btn" onClick={() => setModal('draw')}>
              Draw signature
            </button>
            <button className="btn" onClick={() => setModal('type')}>
              Type it
            </button>
          </div>
          <label className="ck">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I have read this contract and I agree to it.
          </label>
          <button className="btn p full" onClick={finish}>
            Sign the contract
          </button>
          <p className="pp-note">Signed on this phone. Nothing is uploaded; you send it back yourself on WhatsApp.</p>
        </section>
      </main>
      <a className="pp-made" href="#/">
        Made with <b>Generate</b>
      </a>
      {modal === 'draw' && <DrawSignatureModal onClose={() => setModal(null)} onUse={(s) => (setSig(s), setModal(null))} />}
      {modal === 'type' && <TypeSignatureModal initial={name} onClose={() => setModal(null)} onUse={(s) => (setSig(s), setModal(null))} />}
    </div>
  )
}
