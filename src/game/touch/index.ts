import type { HeldControls } from '../../types/game'
import type { Stick, TouchInput } from './types'

export type { Stick, TouchInput }

const EMPTY: HeldControls = {
  forward: false,
  left: false,
  right: false,
  fire: false,
  fireLeft: false,
  fireRight: false,
}

const DRAG_DEAD_ZONE = 0.15
const STICK_DEAD_ZONE = 0.12
const ALIGNED = 0.25

const angleDelta = (from: number, to: number): number => {
  let delta = to - from
  const turn = Math.PI * 2
  while (delta > Math.PI) delta -= turn
  while (delta < -Math.PI) delta += turn
  return delta
}

export const stickFromDrag = (dx: number, dy: number, radius: number): Stick | null => {
  const distance = Math.hypot(dx, dy)
  if (distance < radius * DRAG_DEAD_ZONE) return null
  const reach = Math.min(distance, radius) / radius
  return { x: (dx / distance) * reach, y: (dy / distance) * reach }
}

export const controlsFromStick = (shipRotation: number, stick: Stick | null): HeldControls => {
  if (!stick) return { ...EMPTY }
  if (Math.hypot(stick.x, stick.y) < STICK_DEAD_ZONE) return { ...EMPTY }
  const desired = Math.atan2(stick.x, -stick.y)
  const delta = angleDelta(shipRotation, desired)
  return {
    forward: true,
    left: delta < -ALIGNED,
    right: delta > ALIGNED,
    fire: false,
    fireLeft: false,
    fireRight: false,
  }
}

export const controlsFromTouch = (shipRotation: number, input: TouchInput): HeldControls => {
  return {
    ...controlsFromStick(shipRotation, input.stick),
    fire: input.fire,
    fireLeft: input.fireLeft,
    fireRight: input.fireRight,
  }
}
