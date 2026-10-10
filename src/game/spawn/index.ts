import { circleHitsRect } from '../collision'

export const SPAWN_POINTS = [
  { x: 928, y: 96 },
  { x: 928, y: 384 },
  { x: 928, y: 672 },
  { x: 512, y: 96 },
  { x: 512, y: 672 },
  { x: 96, y: 96 },
  { x: 96, y: 384 },
  { x: 96, y: 672 },
]

export function spawnPoint(args: {
  x: number
  y: number
  enemies: { x: number; y: number; alive: boolean }[]
  startIndex: number
  minPlayerDistance: number
  minShipDistance: number
  shipRadius: number
  islands: { x: number; y: number; width: number; height: number }[]
  points?: { x: number; y: number }[]
}): { x: number; y: number; nextIndex: number } | null {
  const points = args.points ?? SPAWN_POINTS
  const count = points.length
  if (count === 0) return null

  for (let offset = 0; offset < count; offset++) {
    const index = (args.startIndex + offset) % count
    const { x, y } = points[index]

    if (args.islands.some((island) => circleHitsRect({ x, y, radius: args.shipRadius }, island))) {
      continue
    }

    if (Math.hypot(args.x - x, args.y - y) < args.minPlayerDistance) {
      continue
    }

    const blockedByEnemy = args.enemies.some(
      (enemy) =>
        enemy.alive &&
        Math.hypot(enemy.x - x, enemy.y - y) < args.minShipDistance,
    )
    if (blockedByEnemy) continue

    return { x, y, nextIndex: (index + 1) % count }
  }

  return null
}
