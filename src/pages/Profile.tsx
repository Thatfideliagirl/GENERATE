import { useEffect, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Profile as ProfileType } from '../lib/types'
import { BRAND, BUSINESS_TYPES, FONTS, LAYOUTS, TRADES } from '../lib/constants'
import { saveFile } from '../lib/pdf'
import { socialLines } from '../lib/social'
import { accentOf } from '../lib/style'
import { ACCENT_CHOICES, getAccent, getTheme, setAccent, setTheme, type Theme } from '../lib/theme'
import { BrandMark, PageHeader } from '../components/TopBar'
import { ProfileForm } from '../components/ProfileForm'
import { EditIcon, GlobeIcon, MoonIcon, SunIcon } from '../components/Icons'
import { useStore } from '../data/store'
import { useAuth } from '../data/session'
import { useToast } from '../components/Toast'
import { resetTour } from '../components/Tour'

function Info({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="card a-info">
      <div className="a-infoh">
        <h3 className="s">{title}</h3>
        <button className="a-pen" onClick={onEdit} aria-label={'Edit ' + title.toLowerCase()}>
          <EditIcon />
        </button>
      </div>
      {children}
    </section>
  )
}

function Line({ k, v }: { k: string; v?: string }) {
  return (
    <div className="a-line">
      <span>{k}</span>
      <b className={v ? '' : 'none'}>{v || 'Not added yet'}</b>
    </div>
  )
}

/** Your profile as others see it on your documents, with a pen to change any part, and your settings underneath. */
export default function ProfilePage({ profile: p }: { profile: ProfileType }) {
  const nav = useNavigate()
  const toast = useToast()
  const { data, restore } = useStore()
  const { session, signOut } = useAuth()
  const [theme, setThemeState] = useState<Theme>(getTheme())
  const [accent, setAccentState] = useState(getAccent())
  const edit = () => nav('/app/profile/edit')

  const bizType = p.bizType === 'other' ? p.bizOther : BUSINESS_TYPES.find(([v]) => v === p.bizType)?.[1]
  const trade = p.trade === 'other' ? p.tradeOther : TRADES[p.trade]
  const socials = socialLines(p)

  useEffect(() => {
    const on = (e: Event) => setThemeState((e as CustomEvent<Theme>).detail)
    window.addEventListener('generate-theme', on)
    return () => window.removeEventListener('generate-theme', on)
  }, [])
  const pickTheme = (t: Theme) => setTheme(t)

  const backup = () => saveFile(`${BRAND} backup.json`, new Blob([JSON.stringify(data)], { type: 'application/json' }))
  const restoreFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      if (!restore(JSON.parse(await file.text()))) throw new Error('bad file')
      toast('Backup restored')
      nav('/app')
    } catch {
      toast('That file could not be used. Try another one.')
    }
  }

  return (
    <>
      <PageHeader
        title="Profile"
        onBack={() => nav('/app')}
        right={
          <button className="back" onClick={edit}>
            <EditIcon />
            Edit
          </button>
        }
      />
      <main className="wrap a-profile">
        <section className="card a-phero">
          <BrandMark profile={p} size={72} />
          <div>
            <h1>{p.name}</h1>
            <p className="mu">{[p.owner, bizType, trade].filter(Boolean).join(' · ')}</p>
          </div>
          <button className="btn" onClick={edit}>
            <EditIcon />
            Edit profile
          </button>
        </section>

        <div className="a-infogrid">
          <Info title="Contact" onEdit={edit}>
            <Line k="Email" v={p.email} />
            <Line k="Phone or WhatsApp" v={p.phone} />
            <Line k="Address" v={p.address} />
          </Info>
          <Info title="Payment details" onEdit={edit}>
            <Line k="Bank" v={p.bank.bank} />
            <Line k="Account number" v={p.bank.acct} />
            <Line k="Account name" v={p.bank.name} />
          </Info>
          <Info title="Signature" onEdit={edit}>
            <div className="a-sigshow">{p.signature ? <img src={p.signature} alt="Your signature" /> : <span className="mu small">No signature yet. Tap the pen to draw, type or upload one.</span>}</div>
          </Info>
          <Info title="Money and tax" onEdit={edit}>
            <Line k="Main currency" v={p.currency} />
            <Line k="VAT" v={p.vat ? `${p.vatRate}% added to new documents` : `Off (rate ${p.vatRate}%)`} />
          </Info>
          <Info title="Social media" onEdit={edit}>
            {socials.length ? socials.map((s) => <Line key={s.label} k={s.label} v={s.handle} />) : <p className="mu small a-none">None added. They can print at the bottom of your documents.</p>}
          </Info>
          <Info title="Default look" onEdit={edit}>
            <div className="a-lookshow">
              <span className="a-swatch" style={{ background: accentOf(p.style) }} />
              <span>
                <b>{LAYOUTS[p.style.layout] ?? p.style.layout} layout</b>
                <small>
                  {FONTS[p.style.font] ?? p.style.font} font, {p.style.paper} paper
                </small>
              </span>
            </div>
          </Info>
        </div>

        <h2 className="a-seth">Settings</h2>
        <section className="card a-settings">
          <div className="a-set">
            <div>
              <b>Appearance</b>
              <span className="mu small">Light is the Generate look. Dark is easier on the eyes at night.</span>
            </div>
            <div className="seg a-themeseg" role="radiogroup" aria-label="Appearance">
              <button role="radio" aria-checked={theme === 'light'} className={theme === 'light' ? 'on' : ''} onClick={() => pickTheme('light')}>
                <SunIcon />
                Light
              </button>
              <button role="radio" aria-checked={theme === 'dark'} className={theme === 'dark' ? 'on' : ''} onClick={() => pickTheme('dark')}>
                <MoonIcon />
                Dark
              </button>
            </div>
          </div>
          <div className="a-set">
            <div>
              <b>Accent colour</b>
              <span className="mu small">The colour of highlights, buttons and icons inside Generate. Your documents keep their own look.</span>
            </div>
            <div className="a-accents" role="radiogroup" aria-label="Accent colour">
              {ACCENT_CHOICES.map(([k, hex]) => (
                <button
                  key={k}
                  role="radio"
                  aria-checked={accent === k}
                  aria-label={k}
                  title={k[0].toUpperCase() + k.slice(1)}
                  className={'a-acc' + (accent === k ? ' on' : '')}
                  style={{ background: hex }}
                  onClick={() => {
                    setAccent(k)
                    setAccentState(k)
                  }}
                />
              ))}
            </div>
          </div>
          <div className="a-set">
            <div>
              <b>Backup</b>
              <span className="mu small">Download a copy of everything, or bring one back.</span>
            </div>
            <div className="a-headbtns">
              <button className="btn" onClick={backup}>
                Download backup
              </button>
              <label className="btn filebtn">
                Restore
                <input type="file" accept=".json,application/json" hidden onChange={restoreFile} />
              </label>
            </div>
          </div>
          <div className="a-set">
            <div>
              <b>The tour</b>
              <span className="mu small">See the quick walk through Home again.</span>
            </div>
            <button
              className="btn"
              onClick={() => {
                if (session) resetTour(session.userId)
                nav('/app')
              }}
            >
              Take the tour again
            </button>
          </div>
          <div className="a-set">
            <div>
              <b>Your account</b>
              <span className="mu small">Signed in as {session?.email}.</span>
            </div>
            <button
              className="btn"
              onClick={async () => {
                await signOut()
                nav('/', { replace: true })
              }}
            >
              Sign out
            </button>
          </div>
          <div className="a-set">
            <div>
              <b>The Generate website</b>
              <span className="mu small">How it works, questions and help.</span>
            </div>
            <div className="a-headbtns">
              <Link className="btn" to="/privacy">
                Privacy
              </Link>
              <Link className="btn" to="/">
                <GlobeIcon />
                Go to website
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

/** Change the business details. Saving goes back to the profile. */
export function ProfileEdit({ profile: initial }: { profile: ProfileType }) {
  const nav = useNavigate()
  const toast = useToast()
  const { saveProfile } = useStore()
  const [profile, setProfile] = useState<ProfileType>(initial)
  const [error, setError] = useState('')

  const change = (patch: Partial<ProfileType>) => {
    setProfile((x) => ({ ...x, ...patch }))
    setError('')
  }
  const save = () => {
    if (!profile.name.trim()) return setError('Enter your business name to continue.')
    saveProfile({ ...profile, name: profile.name.trim() })
    toast('Profile saved')
    nav('/app/profile')
  }

  return (
    <>
      <PageHeader title="Edit profile" onBack={() => nav('/app/profile')} />
      <main className="wrap">
        <ProfileForm profile={profile} onChange={change} />
        <p className="err" role="alert">
          {error}
        </p>
      </main>
      <div className="bar">
        <button className="btn" onClick={() => nav('/app/profile')}>
          Cancel
        </button>
        <button className="btn p" onClick={save}>
          Save changes
        </button>
      </div>
    </>
  )
}
