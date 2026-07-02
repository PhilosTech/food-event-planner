import { useEffect, useState } from 'react'

/**
 * Returns true only after `active` has been continuously true for `delayMs`.
 * Used to avoid showing a "slow server" hint during normal fast loads.
 */
export function useDelayedFlag(active: boolean, delayMs: number) {
  const [flag, setFlag] = useState(false)

  useEffect(() => {
    if (!active) {
      setFlag(false)
      return
    }
    const timer = setTimeout(() => setFlag(true), delayMs)
    return () => clearTimeout(timer)
  }, [active, delayMs])

  return flag
}
