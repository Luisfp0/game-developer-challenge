type Circle = { x: number; y: number; radius: number }
type Rect = { x: number; y: number; width: number; height: number }

export function circlesOverlap(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const reach = a.radius + b.radius
  return dx * dx + dy * dy <= reach * reach
}

export function circleHitsRect(circle: Circle, rect: Rect): boolean {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width))
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height))
  const dx = circle.x - closestX
  const dy = circle.y - closestY
  return dx * dx + dy * dy <= circle.radius * circle.radius
}

export function clampToArena(
  x: number,
  y: number,
  radius: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: Math.min(width - radius, Math.max(radius, x)),
    y: Math.min(height - radius, Math.max(radius, y)),
  }
}
