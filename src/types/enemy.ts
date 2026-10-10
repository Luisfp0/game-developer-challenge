export type Enemy = {
  id: number
  kind: 'chaser' | 'shooter'
  x: number
  y: number
  rotation: number
  health: number
  maxHealth: number
  radius: number
  alive: boolean
}
