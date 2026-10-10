import type { LastMatch } from '../../game/lastMatch'
import type { MatchHistoryProps } from './types'

function playedAtLabel(playedAt: string): string {
  const date = new Date(playedAt)
  if (Number.isNaN(date.getTime())) return playedAt
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function reasonLabel(match: LastMatch): string {
  return match.endReason === 'time' ? 'Time is up' : 'Your ship was destroyed'
}

export function MatchHistory({ matches, onBack }: MatchHistoryProps) {
  return (
    <main style={{ maxWidth: 420, margin: '10vh auto', textAlign: 'center' }}>
      <h1>Match History</h1>
      {matches.length === 0 ? (
        <p>No matches yet.</p>
      ) : (
        <ul style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16, padding: 0, listStyle: 'none' }}>
          {matches.map((match) => (
            <li key={`${match.playedAt}-${match.score}`}>
              <p>{playedAtLabel(match.playedAt)}</p>
              <p>Score: {match.score}</p>
              <p>Time played: {Math.round(match.timePlayedSeconds)}s</p>
              <p>{reasonLabel(match)}</p>
              <p>Game session time: {match.matchSeconds}s</p>
              <p>Enemy spawn time: {match.spawnIntervalSeconds}s</p>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onBack}>
        Back
      </button>
    </main>
  )
}
