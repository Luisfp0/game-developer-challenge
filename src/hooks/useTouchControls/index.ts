import { useCallback, useEffect, useRef, useState } from 'react'
import type { Stick, TouchInput } from '../../game/touch'

const EMPTY: TouchInput = { stick: null, fire: false, fireLeft: false, fireRight: false }

export const TOUCH_MAX_WIDTH_PX = 768

export function useTouchControls(pausedRef: { current: boolean }): {
  input: { current: TouchInput }
  clear: () => void
  setStick: (stick: Stick | null) => void
  setFire: (held: boolean) => void
  setFireLeft: (held: boolean) => void
  setFireRight: (held: boolean) => void
  narrow: boolean
} {
  const input = useRef<TouchInput>({ ...EMPTY })
  const [narrow, setNarrow] = useState(
    () => window.matchMedia(`(max-width: ${TOUCH_MAX_WIDTH_PX}px)`).matches,
  )
  const narrowRef = useRef(narrow)
  narrowRef.current = narrow

  const clear = useCallback(() => {
    input.current = { ...EMPTY }
  }, [])

  const setStick = useCallback(
    (stick: Stick | null) => {
      if (pausedRef.current || !narrowRef.current) {
        input.current = { ...EMPTY }
        return
      }
      input.current = { ...input.current, stick }
    },
    [pausedRef],
  )

  const setFire = useCallback(
    (held: boolean) => {
      if (pausedRef.current || !narrowRef.current) {
        input.current = { ...EMPTY }
        return
      }
      input.current = { ...input.current, fire: held }
    },
    [pausedRef],
  )

  const setFireLeft = useCallback(
    (held: boolean) => {
      if (pausedRef.current || !narrowRef.current) {
        input.current = { ...EMPTY }
        return
      }
      input.current = { ...input.current, fireLeft: held }
    },
    [pausedRef],
  )

  const setFireRight = useCallback(
    (held: boolean) => {
      if (pausedRef.current || !narrowRef.current) {
        input.current = { ...EMPTY }
        return
      }
      input.current = { ...input.current, fireRight: held }
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

  return { input, clear, setStick, setFire, setFireLeft, setFireRight, narrow }
}
