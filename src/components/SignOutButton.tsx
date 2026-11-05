import { useNavigate } from 'react-router-dom'
import { useAuth } from '../data/session'
import { SignOutIcon } from './Icons'

/** Signs out and goes back to the Generate homepage. */
export function SignOutButton({ label = true, className = 'a-signout' }: { label?: boolean; className?: string }) {
  const { signOut } = useAuth()
  const nav = useNavigate()
  return (
    <button
      className={className}
      onClick={async () => {
        await signOut()
        nav('/', { replace: true })
      }}
      aria-label="Sign out"
      title="Sign out"
    >
      <SignOutIcon />
      {label && <span>Sign out</span>}
    </button>
  )
}
