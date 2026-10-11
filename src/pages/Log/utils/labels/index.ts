import type { MatchRecord } from '../../../../game/records'

export const playedAtLabel = (playedAt: string): string => {
  const date = new Date(playedAt)
  if (Number.isNaN(date.getTime())) return playedAt
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day} ${month} · ${hours}:${minutes}`
}

export const durationLabel = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

export const reasonLabel = (endReason: MatchRecord['endReason']): string => {
  return endReason === 'time' ? 'Time is up' : 'Destroyed'
}
