import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { stickFromDrag } from '../../game/touch'
import type { TouchControlsProps } from './types'

const PAD = 132
const KNOB = 52
const RADIUS = 40

const fireStyle = {
  minWidth: 76,
  minHeight: 56,
  touchAction: 'none' as const,
  userSelect: 'none' as const,
}

function holdButton(label: string, onHeld: (held: boolean) => void) {
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

export function TouchControls({ onStick, onFire, onFireLeft, onFireRight }: TouchControlsProps) {
  const padRef = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  function pointFrom(event: PointerEvent<HTMLDivElement>) {
    const pad = padRef.current
    if (!pad) return
    const box = pad.getBoundingClientRect()
    const dx = event.clientX - (box.left + box.width / 2)
    const dy = event.clientY - (box.top + box.height / 2)
    const distance = Math.hypot(dx, dy)
    const reach = Math.min(distance, RADIUS)
    const scale = distance === 0 ? 0 : reach / distance
    setKnob({ x: dx * scale, y: dy * scale })
    onStick(stickFromDrag(dx, dy, RADIUS))
  }

  function releaseStick() {
    setKnob({ x: 0, y: 0 })
    onStick(null)
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
      <div
        ref={padRef}
        aria-label="Steer"
        aria-valuemax={1}
        aria-valuemin={-1}
        aria-valuenow={0}
        role="slider"
        tabIndex={0}
        style={{
          position: 'absolute',
          left: 16,
          bottom: 16,
          width: PAD,
          height: PAD,
          borderRadius: '50%',
          background: 'rgba(244, 239, 228, 0.16)',
          border: '2px solid rgba(244, 239, 228, 0.45)',
          touchAction: 'none',
          pointerEvents: 'auto',
        }}
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          pointFrom(event)
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          pointFrom(event)
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
          releaseStick()
        }}
        onPointerCancel={releaseStick}
      >
        <div
          style={{
            position: 'absolute',
            width: KNOB,
            height: KNOB,
            borderRadius: '50%',
            left: (PAD - KNOB) / 2 + knob.x,
            top: (PAD - KNOB) / 2 + knob.y,
            background: 'rgba(244, 239, 228, 0.9)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {holdButton('Left fire', onFireLeft)}
          {holdButton('Right fire', onFireRight)}
        </div>
        {holdButton('Fire', onFire)}
      </div>
    </div>
  )
}
