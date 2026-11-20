import { useEffect } from 'react'

/** Sets the browser tab title while a page is open. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const before = document.title
    document.title = title
    return () => {
      document.title = before
    }
  }, [title])
}
