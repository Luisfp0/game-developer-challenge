import type { EndReason } from '../../types/game'

export type MatchResultProps = {
  score: number
  timePlayedSeconds: number
  endReason: EndReason
  onPlayAgain: () => void
  onMainMenu: () => void
}
