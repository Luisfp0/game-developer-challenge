export type Enemy = {
  id: number
  kind: 'chaser'
  x: number
  y: number
  rotation: number
  health: number
  maxHealth: number
  radius: number
  alive: boolean
}
