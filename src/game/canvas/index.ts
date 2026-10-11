export const fittedArenaSize = (
  viewWidth: number,
  viewHeight: number,
  arenaWidth: number,
  arenaHeight: number,
): { width: number; height: number } => {
  if (viewWidth <= 0 || viewHeight <= 0 || arenaWidth <= 0 || arenaHeight <= 0) {
    return { width: 0, height: 0 }
  }
  const arenaRatio = arenaWidth / arenaHeight
  if (viewWidth / viewHeight > arenaRatio) {
    return { width: viewHeight * arenaRatio, height: viewHeight }
  }
  return { width: viewWidth, height: viewWidth / arenaRatio }
}
