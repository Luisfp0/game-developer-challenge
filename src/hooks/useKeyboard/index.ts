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

export function mergeControls(keyboard: HeldControls, touch: HeldControls): HeldControls {
  return {
    forward: keyboard.forward || touch.forward,
    left: keyboard.left || touch.left,
    right: keyboard.right || touch.right,
    fire: keyboard.fire || touch.fire,
  }
}

export function useKeyboard(pausedRef: { current: boolean }): {
  controls: { current: HeldControls }
  clear: () => void
} {
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
