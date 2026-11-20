import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Profile } from '../lib/types'
import { CONTRACT_TEMPLATES } from '../lib/templates'
import { newDoc } from '../lib/factory'
import { resolveText } from '../lib/text'
import { PageHeader } from '../components/TopBar'
import { ContractIcon, PlusIcon } from '../components/Icons'
import { useStore } from '../data/store'

/** Choose a starting point for a contract. The previews read with your own business name filled in. */
export default function ContractTemplates({ profile }: { profile: Profile }) {
  const nav = useNavigate()
  const { data } = useStore()
  const mine = data.templates
  const sample = useMemo(() => newDoc('contract', profile, '0000'), [profile])
  const preview = (body: string) =>
    resolveText(body, sample, profile)
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('# '))
      .join(' ')
      .slice(0, 180)

  const card = (t: { id: string; title: string; body: string }) => (
    <button key={t.id} className="tpl" onClick={() => nav(`/app/new/contract?template=${t.id}`)}>
      <span className="a-ico">
        <ContractIcon />
      </span>
      <b>{t.title}</b>
      <span className="mu small">{preview(t.body)}</span>
    </button>
  )

  return (
    <>
      <PageHeader title="New contract" onBack={() => nav('/app')} />
      <main className="wrap">
        <h1 style={{ marginTop: 4 }}>
          Start from a <em>ready</em> agreement.
        </h1>
        <p className="mu" style={{ margin: '0 0 8px' }}>
          Pick one, then change any line. Your business name, your client and the dates fill in by themselves.
        </p>
        <h2>Our templates</h2>
        <div className="a-tplgrid">{CONTRACT_TEMPLATES.map(card)}</div>
        {mine.length > 0 && (
          <>
            <h2>Your templates</h2>
            <div className="a-tplgrid">{mine.map(card)}</div>
          </>
        )}
        <h2>Or write your own</h2>
        <div className="a-tplgrid">
          <button className="tpl blank" onClick={() => nav('/app/new/contract')}>
            <span className="a-ico">
              <PlusIcon />
            </span>
            <b>Start blank</b>
            <span className="mu small">Write every clause yourself.</span>
          </button>
        </div>
        <p className="mu small a-lawyer">These are plain starting points, not legal advice. Have a lawyer check important agreements.</p>
      </main>
    </>
  )
}
