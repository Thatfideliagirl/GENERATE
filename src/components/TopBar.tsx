import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Profile } from '../lib/types'
import { initialsOf } from '../lib/initials'
import { BackIcon } from './Icons'
import { ThemeToggle } from './ThemeToggle'
import { SignOutButton } from './SignOutButton'

export function BrandMark({ profile, size = 34 }: { profile: Profile; size?: number }) {
  if (profile.logo) {
    return <img src={profile.logo} alt="" style={{ height: size, maxWidth: size * 2.4, objectFit: 'contain' }} />
  }
  const letter = profile.useInitials ? initialsOf(profile.name) : (profile.name || 'G').trim()[0].toUpperCase()
  return (
    <span className="mono" style={{ width: size, height: size, fontSize: Math.round(size * (letter.length > 1 ? 0.36 : 0.44)), borderRadius: Math.round(size * 0.3) }}>
      {letter}
    </span>
  )
}

/** The top of the home screen on a phone: your business on the left, your profile on the right. */
export function AppHeader({ profile }: { profile: Profile }) {
  return (
    <header className="top a-phonetop">
      <Link to="/app" className="brand">
        <BrandMark profile={profile} />
        <span>{profile.name}</span>
      </Link>
      <span className="a-phonetools">
        <ThemeToggle />
        <SignOutButton label={false} className="a-theme" />
        <Link to="/app/profile" className="a-avatar" aria-label="Your profile">
          {initialsOf(profile.owner || profile.name)}
        </Link>
      </span>
    </header>
  )
}

/** Every inner page starts with a clear Back button and its title. */
export function PageHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="top a-pagetop">
      <button className="back" onClick={onBack}>
        <BackIcon />
        Back
      </button>
      <div className="ttl2">{title}</div>
      <span className="a-right">{right}</span>
    </header>
  )
}
