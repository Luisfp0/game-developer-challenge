import type { Circle, Rect } from './types'

export const circlesOverlap = (a: Circle, b: Circle): boolean => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const reach = a.radius + b.radius
  return dx * dx + dy * dy <= reach * reach
}

export const circleHitsRect = (circle: Circle, rect: Rect): boolean => {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width))
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height))
  const dx = circle.x - closestX
  const dy = circle.y - closestY
  return dx * dx + dy * dy <= circle.radius * circle.radius
}

const roundRectCore = (rect: Rect, cornerRadius: number) => {
  const corner = Math.min(cornerRadius, rect.width / 2, rect.height / 2)
  return {
    corner,
    left: rect.x + corner,
    right: rect.x + rect.width - corner,
    top: rect.y + corner,
    bottom: rect.y + rect.height - corner,
  }
}

export const circleHitsRoundRect = (circle: Circle, rect: Rect, cornerRadius: number): boolean => {
  const core = roundRectCore(rect, cornerRadius)
  const closestX = Math.max(core.left, Math.min(circle.x, core.right))
  const closestY = Math.max(core.top, Math.min(circle.y, core.bottom))
  const dx = circle.x - closestX
  const dy = circle.y - closestY
  const limit = core.corner + circle.radius
  return dx * dx + dy * dy <= limit * limit
}

export const pushOutOfRoundRect = (
  circle: Circle,
  rect: Rect,
  cornerRadius: number,
): { x: number; y: number } | null => {
  const core = roundRectCore(rect, cornerRadius)
  const closestX = Math.max(core.left, Math.min(circle.x, core.right))
  const closestY = Math.max(core.top, Math.min(circle.y, core.bottom))
  const dx = circle.x - closestX
  const dy = circle.y - closestY
  const limit = core.corner + circle.radius
  const distSq = dx * dx + dy * dy
  if (distSq > limit * limit) return null
  const dist = Math.sqrt(distSq)
  if (dist > 0.0001) {
    const push = limit - dist
    return { x: circle.x + (dx / dist) * push, y: circle.y + (dy / dist) * push }
  }
  const left = circle.x - core.left
  const right = core.right - circle.x
  const top = circle.y - core.top
  const bottom = core.bottom - circle.y
  const nearest = Math.min(left, right, top, bottom)
  if (nearest === left) return { x: core.left - limit, y: circle.y }
  if (nearest === right) return { x: core.right + limit, y: circle.y }
  if (nearest === top) return { x: circle.x, y: core.top - limit }
  return { x: circle.x, y: core.bottom + limit }
}

export const clampToArena = (
  x: number,
  y: number,
  radius: number,
  width: number,
  height: number,
): { x: number; y: number } => {
  return {
    x: Math.min(width - radius, Math.max(radius, x)),
    y: Math.min(height - radius, Math.max(radius, y)),
  }
}
