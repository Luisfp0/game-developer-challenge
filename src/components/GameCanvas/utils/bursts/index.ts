import { EXPLODE_SECONDS, HIT_SECONDS, SHOT_SECONDS } from './constants'
import type { BurstKind } from './types'

export const burstLife = (kind: BurstKind): number => {
  if (kind === 'explode') return EXPLODE_SECONDS
  if (kind === 'hit') return HIT_SECONDS
  return SHOT_SECONDS
}

export const burstScale = (kind: BurstKind): number => {
  if (kind === 'shot') return 0.45
  if (kind === 'hit') return 0.7
  return 1
}

export const explosionFrame = (age: number): number =>
  Math.min(2, Math.floor((age / EXPLODE_SECONDS) * 3))
