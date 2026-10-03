import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { defaultProfile } from '../lib/factory'
import type { Profile } from '../lib/types'
import { ProfileForm } from '../components/ProfileForm'
import { useStore } from '../data/store'
import { useToast } from '../components/Toast'

export default function Setup() {
  const nav = useNavigate()
  const toast = useToast()
  const { saveProfile, data } = useStore()
  const [profile, setProfile] = useState<Profile>(data.profile ?? defaultProfile())
  const [error, setError] = useState('')

  const change = (patch: Partial<Profile>) => {
    setProfile((p) => ({ ...p, ...patch }))
    setError('')
  }

  const create = () => {
    if (!profile.name.trim()) return setError('Enter your business name to continue.')
    saveProfile({ ...profile, name: profile.name.trim() })
    toast('Profile saved')
    nav('/app', { replace: true })
  }

  return (
    <>
      <section className="hero">
        <div>
          <img className="logo-chip" src="./logo.png" alt="Generate" />
          <button className="btn g herolink" onClick={() => nav('/')}>
            Back
          </button>
          <h1>Set up your business.</h1>
          <p>Add your details once. Every document you make after this carries your name, your logo and your signature.</p>
        </div>
      </section>
      <main className="wrap" style={{ paddingTop: 26 }}>
        <ProfileForm profile={profile} onChange={change} />
        <p className="err" role="alert">
          {error}
        </p>
      </main>
      <div className="bar">
        <button className="btn p" onClick={create}>
          Create my profile
        </button>
      </div>
    </>
  )
}
