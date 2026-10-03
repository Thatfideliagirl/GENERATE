import { useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Profile } from '../lib/types'
import { BUSINESS_TYPES, CURRENCIES, TRADES } from '../lib/constants'
import { readImage } from '../lib/image'
import { SOCIALS } from '../lib/social'
import { Field, Grid2, Section, SelectField } from './Fields'
import { LookControls } from './LookControls'
import { DrawSignatureModal, TypeSignatureModal } from './SignatureModals'
import { useToast } from './Toast'

interface Props {
  profile: Profile
  onChange: (patch: Partial<Profile>) => void
  /** The default look lives on the profile page, so sign up leaves it out. */
  showLook?: boolean
}

/** The business details form, shared by the first time setup and the profile page. */
export function ProfileForm({ profile: p, onChange, showLook = true }: Props) {
  const toast = useToast()
  const [modal, setModal] = useState<'draw' | 'type' | null>(null)

  const pick = (kind: 'logo' | 'signature') => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = await readImage(file, kind === 'logo' ? 420 : 600, kind === 'signature')
      onChange({ [kind]: data })
    } catch {
      toast('That file could not be used. Try another picture.')
    }
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Your business</h2>
      <Field label="Business name" value={p.name} onChange={(v) => onChange({ name: v })} placeholder="Atelier Obi" />
      <Field label="Your name" value={p.owner} onChange={(v) => onChange({ owner: v })} placeholder="Chioma Obi" />
      <Grid2>
        <Field label="Email" type="email" value={p.email} onChange={(v) => onChange({ email: v })} />
        <Field label="Phone or WhatsApp" type="tel" value={p.phone} onChange={(v) => onChange({ phone: v })} />
      </Grid2>
      <Field label="Address" value={p.address} onChange={(v) => onChange({ address: v })} />

      <Section title="About you">
        <SelectField label="Which describes you best" value={p.bizType} onChange={(v) => onChange({ bizType: v })} options={BUSINESS_TYPES} />
        {p.bizType === 'other' && (
          <Field label="Tell us what describes you" value={p.bizOther ?? ''} onChange={(v) => onChange({ bizOther: v })} placeholder="For example, a church or a school" />
        )}
        <SelectField label="What do you sell or do" value={p.trade} onChange={(v) => onChange({ trade: v })} options={Object.entries(TRADES)} />
        {p.trade === 'other' && (
          <Field label="Tell us what you sell or do" value={p.tradeOther ?? ''} onChange={(v) => onChange({ tradeOther: v })} placeholder="For example, event planning" />
        )}
      </Section>

      <Section title="Social media">
        <p className="mu small" style={{ marginTop: 0 }}>
          Optional. When you make an invoice, receipt or contract you can tick a box to print these at the bottom.
        </p>
        <Grid2>
          {SOCIALS.map(({ key, label, placeholder }) => (
            <Field
              key={key}
              label={label}
              value={p.socials?.[key] ?? ''}
              placeholder={placeholder}
              onChange={(v) => onChange({ socials: { instagram: '', twitter: '', tiktok: '', ...p.socials, [key]: v } })}
            />
          ))}
        </Grid2>
      </Section>

      <Section title="Logo">
        <div className="lgp">
          {p.logo ? <img src={p.logo} alt="Your logo" /> : <span className="mu small">No logo yet. Your first letter is used until you add one.</span>}
        </div>
        <div className="chips">
          <label className="btn filebtn">
            {p.logo ? 'Change logo' : 'Upload logo'}
            <input type="file" accept="image/*" hidden onChange={pick('logo')} />
          </label>
          {p.logo && (
            <button className="btn g dg" onClick={() => onChange({ logo: '' })}>
              Remove
            </button>
          )}
        </div>
      </Section>

      <Section title="Signature">
        <div className="lgp">
          {p.signature ? <img src={p.signature} alt="Your signature" /> : <span className="mu small">Add a signature to place on invoices and contracts.</span>}
        </div>
        <div className="chips">
          <button className="btn" onClick={() => setModal('type')}>
            Type signature
          </button>
          <button className="btn" onClick={() => setModal('draw')}>
            Draw signature
          </button>
          <label className="btn filebtn">
            Upload picture
            <input type="file" accept="image/*" hidden onChange={pick('signature')} />
          </label>
          {p.signature && (
            <button className="btn g dg" onClick={() => onChange({ signature: '' })}>
              Remove
            </button>
          )}
        </div>
      </Section>

      <Section title="Payment details">
        <p className="mu small" style={{ marginTop: 0 }}>
          Shown on your invoices so clients know where to pay.
        </p>
        <Field label="Bank name" value={p.bank.bank} onChange={(v) => onChange({ bank: { ...p.bank, bank: v } })} />
        <Grid2>
          <Field label="Account number" value={p.bank.acct} onChange={(v) => onChange({ bank: { ...p.bank, acct: v } })} />
          <Field label="Account name" value={p.bank.name} onChange={(v) => onChange({ bank: { ...p.bank, name: v } })} />
        </Grid2>
      </Section>

      <Section title="Money and tax">
        <Grid2>
          <SelectField label="Main currency" value={p.currency} onChange={(v) => onChange({ currency: v })} options={CURRENCIES} />
          <Field label="VAT rate (%)" type="number" value={p.vatRate} onChange={(v) => onChange({ vatRate: v === '' ? 0 : Number(v) })} />
        </Grid2>
        <label className="ck">
          <input type="checkbox" checked={p.vat} onChange={(e) => onChange({ vat: e.target.checked })} /> Add VAT to new documents by default
        </label>
      </Section>

      {showLook && (
        <Section title="Default look">
          <LookControls style={p.style} onChange={(patch) => onChange({ style: { ...p.style, ...patch } })} />
        </Section>
      )}

      {modal === 'draw' && (
        <DrawSignatureModal
          onClose={() => setModal(null)}
          onUse={(signature) => {
            onChange({ signature })
            setModal(null)
          }}
        />
      )}
      {modal === 'type' && (
        <TypeSignatureModal
          initial={(p.owner || p.name).trim()}
          onClose={() => setModal(null)}
          onUse={(signature) => {
            onChange({ signature })
            setModal(null)
          }}
        />
      )}
    </>
  )
}
