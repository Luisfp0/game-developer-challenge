import type { PauseOverlayProps } from './types'

export function PauseOverlay({ onResume }: PauseOverlayProps) {
  return (
    <div
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
      <button type="button" onClick={onResume}>
        Resume
      </button>
    </div>
  )
}
