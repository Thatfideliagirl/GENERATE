import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Profile as ProfileType } from '../lib/types'
import { BRAND } from '../lib/constants'
import { saveFile } from '../lib/pdf'
import { PageHeader } from '../components/TopBar'
import { ProfileForm } from '../components/ProfileForm'
import { useStore } from '../data/store'
import { useToast } from '../components/Toast'

export default function ProfilePage({ profile: initial }: { profile: ProfileType }) {
  const nav = useNavigate()
  const toast = useToast()
  const { data, saveProfile, restore } = useStore()
  const [profile, setProfile] = useState<ProfileType>(initial)
  const [error, setError] = useState('')

  const change = (patch: Partial<ProfileType>) => {
    setProfile((p) => ({ ...p, ...patch }))
    setError('')
  }

  const save = () => {
    if (!profile.name.trim()) return setError('Enter your business name to continue.')
    saveProfile({ ...profile, name: profile.name.trim() })
    toast('Profile saved')
    nav('/app')
  }

  const backup = () => {
    saveFile(`${BRAND} backup.json`, new Blob([JSON.stringify(data)], { type: 'application/json' }))
  }

  const restoreFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const ok = restore(JSON.parse(await file.text()))
      if (!ok) throw new Error('bad file')
      toast('Backup restored')
      nav('/app')
    } catch {
      toast('That file could not be used. Try another one.')
    }
  }

  return (
    <>
      <PageHeader title="Your profile" onBack={() => nav('/app')} />
      <main className="wrap">
        <ProfileForm profile={profile} onChange={change} />
        <div className="sec">
          <h3 className="s">Backup</h3>
          <p className="mu small" style={{ marginTop: 0 }}>
            Everything is stored on this device. Download a backup file so you never lose your documents.
          </p>
          <div className="chips">
            <button className="btn" onClick={backup}>
              Download backup
            </button>
            <label className="btn filebtn">
              Restore backup
              <input type="file" accept=".json,application/json" hidden onChange={restoreFile} />
            </label>
          </div>
        </div>
        <p className="err" role="alert">
          {error}
        </p>
      </main>
      <div className="bar">
        <button className="btn p" onClick={save}>
          Save profile
        </button>
      </div>
    </>
  )
}
