import type { EndReason } from '../../types/game'

export type MatchResultProps = {
  score: number
  timePlayedSeconds: number
  endReason: EndReason
  saved: boolean
  onPlayAgain: () => void
  onMainMenu: () => void
}
