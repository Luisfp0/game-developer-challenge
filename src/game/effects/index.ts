export const hullFlames = (health: number, maxHealth: number): 0 | 1 | 2 => {
  if (health <= 0 || health >= maxHealth) return 0
  if (maxHealth - health >= 2) return 2
  return 1
}
