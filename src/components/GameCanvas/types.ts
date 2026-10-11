import { Container, Sprite } from 'pixi.js'
import type { TouchInput } from '../../game/touch'
import type { HeldControls, MatchSnapshot } from '../../types/game'


export type GameCanvasProps = {
  onSnapshot: (snapshot: MatchSnapshot) => void
  onLoadError: (message: string) => void
  pausedRef: { current: boolean }
  keyboardRef: { current: HeldControls }
  touchRef: { current: TouchInput }
  matchSeconds: number
  spawnIntervalSeconds: number
}

export type BurstKind = 'shot' | 'hit' | 'explode'
export type Flames = { one: Sprite; two: Sprite }
export type HealthBar = {
  view: Container
  width: number
  setRatio: (ratio: number) => void
}
