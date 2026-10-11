export const wholeInRange = (value: string, min: number, max: number): number | null => {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const number = Number(trimmed)
  if (number < min || number > max) return null
  return number
}
