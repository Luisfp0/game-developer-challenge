export const facing = (rotation: number): { x: number; y: number } => {
  return { x: Math.sin(rotation), y: -Math.cos(rotation) }
}
