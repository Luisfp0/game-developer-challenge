export function stepWhole(value: string, delta: number, min: number, max: number, step: number): string {
  if (!/^\d+$/.test(value.trim())) return String(min)
  const current = Number(value.trim())
  const next = Math.min(max, Math.max(min, current + delta * step))
  return String(next)
}
