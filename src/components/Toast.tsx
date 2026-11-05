import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type ToastFn = (message: string) => void
const Ctx = createContext<ToastFn>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [on, setOn] = useState(false)
  const timer = useRef<number>()

  const toast = useCallback<ToastFn>((m) => {
    setMessage(m)
    setOn(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOn(false), 2300)
  }, [])

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className={'toast' + (on ? ' on' : '')} role="status" aria-live="polite">
        {message}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
