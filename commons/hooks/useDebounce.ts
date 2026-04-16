import { useState, useEffect } from 'react'
import { DEBOUNCE_MS } from '../constants'

export function useDebounce<T>(value: T, delay: number = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(value) }, delay)
    return () => { clearTimeout(timer) }
  }, [value, delay])

  return debounced
}
