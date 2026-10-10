import { useEffect, useRef } from 'react'
import type { HeldControls } from '../../types/game'

const EMPTY: HeldControls = {
  forward: false,
  left: false,
  right: false,
  fire: false,
}

export function controlsFromKeys(keys: Set<string>): HeldControls {
  return {
    forward: keys.has('KeyW') || keys.has('ArrowUp'),
    left: keys.has('KeyA') || keys.has('ArrowLeft'),
    right: keys.has('KeyD') || keys.has('ArrowRight'),
    fire: keys.has('Space'),
  }
}

export function useKeyboard(active: boolean): { current: HeldControls } {
  const controls = useRef<HeldControls>({ ...EMPTY })

  useEffect(() => {
    if (!active) {
      controls.current = { ...EMPTY }
      return
    }
    const keys = new Set<string>()
    const sync = () => {
      controls.current = controlsFromKeys(keys)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault()
      keys.add(event.code)
      sync()
    }
    const onKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.code)
      sync()
    }
    const clear = () => {
      keys.clear()
      controls.current = { ...EMPTY }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clear)
      clear()
    }
  }, [active])

  return controls
}
