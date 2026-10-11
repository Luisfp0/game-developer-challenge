import { GoldButton, Screen } from '../ui'
import type { MatchResultProps } from './types'

const STATUS_LABEL = {
  saved: 'Saved.',
  pending: 'Pending.',
  failed: 'Could not be saved.',
} as const

export const MatchResult = ({
  score,
  timePlayedSeconds,
  endReason,
  registration,
  onRetry,
  onPlayAgain,
  onMainMenu,
}: MatchResultProps) => {
  const reason = endReason === 'time' ? 'Time is up' : 'Your ship was destroyed'
  return (
    <Screen>
      <h1>Result</h1>
      <p>Score: {score}</p>
      <p>Time played: {Math.round(timePlayedSeconds)}s</p>
      <p>{reason}</p>
      <p role="status">{STATUS_LABEL[registration]}</p>
      <div className="button-stack">
        {registration === 'failed' ? (
          <GoldButton type="button" onClick={onRetry}>
            Try again
          </GoldButton>
        ) : null}
        <GoldButton type="button" onClick={onPlayAgain}>
          Play again
        </GoldButton>
        <GoldButton type="button" variant="secondary" onClick={onMainMenu}>
          Main menu
        </GoldButton>
      </div>
    </Screen>
  )
}
