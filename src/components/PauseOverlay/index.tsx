import { useEffect, useRef, type KeyboardEvent } from 'react'
import { GoldButton } from '../ui'
import type { PauseOverlayProps } from './types'

export function PauseOverlay({ onResume, onMainMenu }: PauseOverlayProps) {
  const resumeRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    resumeRef.current?.focus()
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return
    const first = resumeRef.current
    const last = menuRef.current
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="pause-scrim" role="dialog" aria-modal="true" aria-label="Paused" onKeyDown={onKeyDown}>
      <div className="panel">
        <h1>Paused</h1>
        <p>Ready when you are.</p>
        <div className="button-stack">
          <GoldButton ref={resumeRef} type="button" onClick={onResume}>
            Resume
          </GoldButton>
          <GoldButton ref={menuRef} type="button" variant="secondary" onClick={onMainMenu}>
            Main menu
          </GoldButton>
        </div>
      </div>
    </div>
  )
}
