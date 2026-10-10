export function appliedSeconds(elapsed: number, paused: boolean): number {
  if (paused) return 0
  return elapsed
}
