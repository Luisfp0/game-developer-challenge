import type { MatchSnapshot } from '../../types/game'

export type MatchPageProps = {
  score: number
  remainingSeconds: number
  matchSeconds: number
  spawnIntervalSeconds: number
  onSnapshot: (snapshot: MatchSnapshot) => void
  onLoadError: (message: string) => void
  onMainMenu: () => void
}
