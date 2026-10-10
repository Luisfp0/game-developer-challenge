import type { MouseEvent, PointerEvent } from 'react'
import type { HeldControls } from '../../types/game'
import type { TouchControlsProps } from './types'

const buttonStyle = {
  minWidth: 76,
  minHeight: 56,
  touchAction: 'none' as const,
  userSelect: 'none' as const,
}

function holdHandlers(action: keyof HeldControls, onHold: TouchControlsProps['onHold']) {
  const release = () => onHold(action, false)
  return {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      onHold(action, true)
    },
    onPointerUp: release,
    onPointerCancel: release,
    onPointerLeave: release,
    onContextMenu: (event: MouseEvent<HTMLButtonElement>) => event.preventDefault(),
  }
}

export function TouchControls({ onHold }: TouchControlsProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', gap: 8, pointerEvents: 'auto' }}>
        <button type="button" style={buttonStyle} {...holdHandlers('left', onHold)}>
          Left
        </button>
        <button type="button" style={buttonStyle} {...holdHandlers('forward', onHold)}>
          Forward
        </button>
        <button type="button" style={buttonStyle} {...holdHandlers('right', onHold)}>
          Right
        </button>
      </div>
      <div style={{ position: 'absolute', right: 12, bottom: 12, pointerEvents: 'auto' }}>
        <button type="button" style={buttonStyle} {...holdHandlers('fire', onHold)}>
          Fire
        </button>
      </div>
    </div>
  )
}
