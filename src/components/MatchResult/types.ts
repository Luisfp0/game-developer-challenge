import type { EndReason, RegistrationStatus } from '../../types/game'

export type MatchResultProps = {
  score: number
  timePlayedSeconds: number
  endReason: EndReason
  registration: RegistrationStatus
  onRetry: () => void
  onPlayAgain: () => void
  onMainMenu: () => void
}
