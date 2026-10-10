import type { TouchInput } from '../../game/touch'
import type { HeldControls, MatchSnapshot } from '../../types/game'

export type GameCanvasProps = {
  onSnapshot: (snapshot: MatchSnapshot) => void
  onLoadError: (message: string) => void
  pausedRef: { current: boolean }
  keyboardRef: { current: HeldControls }
  touchRef: { current: TouchInput }
}
