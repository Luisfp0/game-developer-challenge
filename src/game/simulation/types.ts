import type { Enemy } from '../../types/enemy'
import type { HeldControls, MatchSnapshot } from '../../types/game'
import type { Ship } from '../../types/ship'

export type MatchSeed = {
  ship?: Partial<Pick<Ship, 'x' | 'y' | 'rotation'>>
  chaser?: Partial<Pick<Enemy, 'x' | 'y'>>
  shooters?: { x: number; y: number }[]
  matchSeconds?: number
  spawnIntervalSeconds?: number
}

export type Match = {
  snapshot: () => MatchSnapshot
  update: (dtSeconds: number, controls: HeldControls) => MatchSnapshot
  subscribe: (listener: (snapshot: MatchSnapshot) => void) => () => void
}
