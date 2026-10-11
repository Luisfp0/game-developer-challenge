export type SavedOptions = {
  matchSeconds: number
  spawnIntervalSeconds: number
}

export type OptionsStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type FieldErrors = {
  matchSeconds: string | null
  spawnIntervalSeconds: string | null
}
