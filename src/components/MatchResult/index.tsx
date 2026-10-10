import { MATCH_NOT_SAVED, MATCH_SAVED } from '../../game/lastMatch'
import type { MatchResultProps } from './types'

export function MatchResult({
  score,
  timePlayedSeconds,
  endReason,
  saved,
  onPlayAgain,
  onMainMenu,
}: MatchResultProps) {
  const reason = endReason === 'time' ? 'Time is up' : 'Your ship was destroyed'
  return (
    <main style={{ maxWidth: 420, margin: '10vh auto', textAlign: 'center' }}>
      <h1>Result</h1>
      <p>Score: {score}</p>
      <p>Time played: {Math.round(timePlayedSeconds)}s</p>
      <p>{reason}</p>
      <p>{saved ? MATCH_SAVED : MATCH_NOT_SAVED}</p>
      <button type="button" onClick={onPlayAgain}>Play again</button>
      <button type="button" onClick={onMainMenu}>Main menu</button>
    </main>
  )
}
