import { useEffect, useRef, type KeyboardEvent } from 'react'
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paused"
      onKeyDown={onKeyDown}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: 'rgba(7, 48, 71, 0.72)',
      }}
    >
      <p>Paused</p>
      <button ref={resumeRef} type="button" onClick={onResume}>
        Resume
      </button>
      <button ref={menuRef} type="button" onClick={onMainMenu}>
        Main menu
      </button>
    </div>
  )
}
