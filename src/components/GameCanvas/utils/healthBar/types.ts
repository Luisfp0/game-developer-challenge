import type { Container } from 'pixi.js'

export type HealthBar = {
  view: Container
  width: number
  setRatio: (ratio: number) => void
}
