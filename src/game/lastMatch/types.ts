import type { EndReason } from '../../types/game'

export type LastMatch = {
  score: number
  timePlayedSeconds: number
  endReason: EndReason
  matchSeconds: number
  spawnIntervalSeconds: number
  playedAt: string
}
