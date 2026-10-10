import type { MatchSnapshot } from '../../types/game'

export type GameCanvasProps = {
  onSnapshot: (snapshot: MatchSnapshot) => void
  onLoadError: (message: string) => void
}
