export type VolleyShot = {
  x: number
  y: number
  vx: number
  vy: number
}

const facing = (rotation: number) => {
  return { x: Math.sin(rotation), y: -Math.cos(rotation) }
}

export const sideVolley = (args: {
  x: number
  y: number
  rotation: number
  side: 'left' | 'right'
  muzzle: number
  spread: number
  speed: number
}): VolleyShot[] => {
  const along = facing(args.rotation)
  const sideDir =
    args.side === 'right'
      ? { x: -along.y, y: along.x }
      : { x: along.y, y: -along.x }
  const clean = (value: number) => (value === 0 ? 0 : value)
  return [-args.spread, 0, args.spread].map((offset) => ({
    x: clean(args.x + along.x * offset + sideDir.x * args.muzzle),
    y: clean(args.y + along.y * offset + sideDir.y * args.muzzle),
    vx: clean(sideDir.x * args.speed),
    vy: clean(sideDir.y * args.speed),
  }))
}
