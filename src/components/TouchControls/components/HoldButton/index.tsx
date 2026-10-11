import type { HoldButtonProps } from './types'

const fireStyle = {
  minWidth: 76,
  minHeight: 56,
  touchAction: 'none' as const,
  userSelect: 'none' as const,
}

export const HoldButton = ({ label, onHeld }: HoldButtonProps) => {
  return (
    <button
      type="button"
      style={fireStyle}
      onPointerDown={(event) => {
        event.preventDefault()
        onHeld(true)
      }}
      onPointerUp={() => onHeld(false)}
      onPointerCancel={() => onHeld(false)}
      onPointerLeave={() => onHeld(false)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {label}
    </button>
  )
}
