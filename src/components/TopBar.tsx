import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Profile } from '../lib/types'
import { useAuth } from '../data/session'
import { initialsOf } from '../lib/initials'

export function BrandMark({ profile, size = 34 }: { profile: Profile; size?: number }) {
  if (profile.logo) {
    return <img src={profile.logo} alt="" style={{ height: size, maxWidth: size * 2.4, objectFit: 'contain' }} />
  }
  const letter = profile.useInitials ? initialsOf(profile.name) : (profile.name || 'G').trim()[0].toUpperCase()
  return (
    <span className="mono" style={{ width: size, height: size, fontSize: Math.round(size * (letter.length > 1 ? 0.4 : 0.5)) }}>
      {letter}
    </span>
  )
}

export function AppHeader({ profile }: { profile: Profile }) {
  const { session } = useAuth()
  return (
    <header className="top">
      <Link to="/app" className="brand">
        <BrandMark profile={profile} />
        <span>{profile.name}</span>
      </Link>
      <span className="top-end">
        {session?.role === 'admin' && (
          <Link className="btn g" to="/admin">
            Owner
          </Link>
        )}
        <Link className="btn g" to="/app/profile">
          Profile
        </Link>
      </span>
    </header>
  )
}

export function PageHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="top">
      <button className="btn g" onClick={onBack}>
        Back
      </button>
      <div className="ttl2">{title}</div>
      {right ?? <span />}
    </header>
  )
}
