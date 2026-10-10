export type Weapon = 'front' | 'left' | 'right'

export type Projectile = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  damage: number
  weapon: Weapon
  owner: 'player' | 'enemy'
}
