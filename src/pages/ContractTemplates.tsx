import { useNavigate } from 'react-router-dom'
import { CONTRACT_TEMPLATES } from '../lib/templates'
import { PageHeader } from '../components/TopBar'
import { useStore } from '../data/store'

export default function ContractTemplates() {
  const nav = useNavigate()
  const { data } = useStore()
  const mine = data.templates
  const preview = (body: string) => body.replace(/#\s/g, '').slice(0, 90) + '...'

  return (
    <>
      <PageHeader title="New contract" onBack={() => nav('/app')} />
      <main className="wrap">
        <h2 style={{ marginTop: 8 }}>Our templates</h2>
        {CONTRACT_TEMPLATES.map((t) => (
          <button key={t.id} className="tpl" onClick={() => nav(`/app/new/contract?template=${t.id}`)}>
            <b>{t.title}</b>
            <span className="mu small">{preview(t.body)}</span>
          </button>
        ))}
        {mine.length > 0 && (
          <>
            <h2>Your templates</h2>
            {mine.map((t) => (
              <button key={t.id} className="tpl" onClick={() => nav(`/app/new/contract?template=${t.id}`)}>
                <b>{t.title}</b>
                <span className="mu small">{preview(t.body)}</span>
              </button>
            ))}
          </>
        )}
        <h2>Or write your own</h2>
        <button className="tpl" onClick={() => nav('/app/new/contract')}>
          <b>Start blank</b>
          <span className="mu small">Write every clause yourself.</span>
        </button>
      </main>
    </>
  )
}
