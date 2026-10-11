import { useEffect, useRef } from 'react'
import type { HeldControls } from '../../types/game'
import { controlsFromKeys } from './utils/controlsFromKeys'

const EMPTY: HeldControls = {
  forward: false,
  left: false,
  right: false,
  fire: false,
  fireLeft: false,
  fireRight: false,
}

export const useKeyboard = (pausedRef: { current: boolean }): {
  controls: { current: HeldControls }
  clear: () => void
} => {
  const controls = useRef<HeldControls>({ ...EMPTY })
  const keys = useRef(new Set<string>())
  const blocked = useRef(new Set<string>())

  const clear = () => {
    for (const code of keys.current) blocked.current.add(code)
    keys.current.clear()
    controls.current = { ...EMPTY }
  }

  useEffect(() => {
    const sync = () => {
      controls.current = controlsFromKeys(keys.current)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault()
      if (pausedRef.current || blocked.current.has(event.code)) return
      keys.current.add(event.code)
      sync()
    }
    const onKeyUp = (event: KeyboardEvent) => {
      blocked.current.delete(event.code)
      keys.current.delete(event.code)
      sync()
    }
    const onBlur = () => {
      clear()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      clear()
    }
  }, [pausedRef])

  return { controls, clear }
}

export { controlsFromKeys }
export { mergeControls } from './utils/mergeControls'
