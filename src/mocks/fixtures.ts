import type { MatchRecord } from '../game/records'

const NAMES = ['Ann', 'Bea', 'Cy', 'Dee', 'Eve', 'Fay', 'Gil', 'Hua', 'Ian', 'Jan', 'Kay', 'Lee']

export const FIXTURES: MatchRecord[] = [
  ...NAMES.map((playerName, index) => ({
    matchId: `fixture-${index + 1}`,
    playerId: `player-${index + 1}`,
    playerName,
    playedAt: `2026-09-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
    score: 12 - index,
    timePlayedSeconds: 40 + index,
    endReason: index % 2 === 0 ? ('time' as const) : ('destroyed' as const),
    matchSeconds: 60,
    spawnIntervalSeconds: 10,
  })),
  {
    matchId: 'fixture-other-config',
    playerId: 'player-other',
    playerName: 'Mo',
    playedAt: '2026-08-01T12:00:00.000Z',
    score: 40,
    timePlayedSeconds: 80,
    endReason: 'time',
    matchSeconds: 90,
    spawnIntervalSeconds: 15,
  },
]
