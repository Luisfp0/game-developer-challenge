import type { Enemy } from './enemy'
import type { Projectile } from './projectile'
import type { Ship } from './ship'

export type Phase = 'menu' | 'options' | 'ranking' | 'history' | 'playing' | 'result'
export type RegistrationStatus = 'saved' | 'pending' | 'failed'
export type EndReason = 'time' | 'destroyed'

export type HeldControls = {
  forward: boolean
  left: boolean
  right: boolean
  fire: boolean
  fireLeft: boolean
  fireRight: boolean
}

export type Island = {
  x: number
  y: number
  width: number
  height: number
}

export type MatchSnapshot = {
  phase: 'playing' | 'result'
  score: number
  remainingSeconds: number
  timePlayedSeconds: number
  playerHealth: number
  endReason: EndReason | null
  ship: Ship
  enemies: Enemy[]
  projectiles: Projectile[]
  islands: Island[]
}
