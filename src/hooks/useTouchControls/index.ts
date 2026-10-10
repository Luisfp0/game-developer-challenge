import { useCallback, useEffect, useRef, useState } from 'react'
import type { HeldControls } from '../../types/game'

const EMPTY: HeldControls = {
  forward: false,
  left: false,
  right: false,
  fire: false,
}

export const TOUCH_MAX_WIDTH_PX = 768

export function useTouchControls(pausedRef: { current: boolean }): {
  controls: { current: HeldControls }
  clear: () => void
  setHeld: (action: keyof HeldControls, held: boolean) => void
  narrow: boolean
} {
  const controls = useRef<HeldControls>({ ...EMPTY })
  const [narrow, setNarrow] = useState(
    () => window.matchMedia(`(max-width: ${TOUCH_MAX_WIDTH_PX}px)`).matches,
  )
  const narrowRef = useRef(narrow)
  narrowRef.current = narrow

  const clear = useCallback(() => {
    controls.current = { ...EMPTY }
  }, [])

  const setHeld = useCallback(
    (action: keyof HeldControls, held: boolean) => {
      if (pausedRef.current || !narrowRef.current) {
        controls.current = { ...EMPTY }
        return
      }
      controls.current = { ...controls.current, [action]: held }
    },
    [pausedRef],
  )

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${TOUCH_MAX_WIDTH_PX}px)`)
    const onChange = () => {
      setNarrow(query.matches)
      if (!query.matches) clear()
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [clear])

  useEffect(() => {
    if (!narrow) clear()
  }, [narrow, clear])

  return { controls, clear, setHeld, narrow }
}
