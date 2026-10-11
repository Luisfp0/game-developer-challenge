import { describe, expect, it } from 'vitest'
import {
  OPTIONS_STORAGE_KEY,
  fieldErrors,
  optionsFromFields,
  readOptions,
  writeOptions,
} from './index'

const sessionError = 'Game session time must be a whole number from 60 to 180.'
const spawnError = 'Enemy spawn time must be a whole number from 5 to 30.'

const memory = () => {
  const data = new Map<string, string>()
  return {
    getItem(key: string) {
      return data.get(key) ?? null
    },
    setItem(key: string, value: string) {
      data.set(key, value)
    },
  }
}

describe('fieldErrors', () => {
  it('rejects an empty session time and keeps a valid spawn time', () => {
    expect(fieldErrors('', '10')).toEqual({
      matchSeconds: sessionError,
      spawnIntervalSeconds: null,
    })
  })

  it('rejects a fractional session time', () => {
    expect(fieldErrors('12.5', '10').matchSeconds).toBe(sessionError)
  })

  it('rejects a session time outside 60 to 180', () => {
    expect(fieldErrors('59', '10').matchSeconds).toBe(sessionError)
    expect(fieldErrors('181', '10').matchSeconds).toBe(sessionError)
  })

  it('rejects letters and a spawn time outside 5 to 30', () => {
    expect(fieldErrors('60', 'abc').spawnIntervalSeconds).toBe(spawnError)
    expect(fieldErrors('60', '4').spawnIntervalSeconds).toBe(spawnError)
    expect(fieldErrors('60', '31').spawnIntervalSeconds).toBe(spawnError)
  })

  it('reports both messages when both fields fail', () => {
    expect(fieldErrors('', 'abc')).toEqual({
      matchSeconds: sessionError,
      spawnIntervalSeconds: spawnError,
    })
  })

  it('accepts 60, 10, 30 and a padded 60', () => {
    expect(fieldErrors('60', '10')).toEqual({
      matchSeconds: null,
      spawnIntervalSeconds: null,
    })
    expect(optionsFromFields('60', '10')).toEqual({
      matchSeconds: 60,
      spawnIntervalSeconds: 10,
    })
    expect(optionsFromFields(' 60 ', '30')).toEqual({
      matchSeconds: 60,
      spawnIntervalSeconds: 30,
    })
  })

  it('returns null when a field is invalid', () => {
    expect(optionsFromFields('', '10')).toBeNull()
  })
})

describe('readOptions', () => {
  it('returns 60 and 10 when the key is missing', () => {
    expect(readOptions(memory())).toEqual({
      matchSeconds: 60,
      spawnIntervalSeconds: 10,
    })
  })

  it('returns 60 and 10 when the stored text is not JSON', () => {
    const storage = memory()
    storage.setItem(OPTIONS_STORAGE_KEY, '{')
    expect(readOptions(storage)).toEqual({
      matchSeconds: 60,
      spawnIntervalSeconds: 10,
    })
  })

  it('returns 60 and 10 when a stored number is outside its range', () => {
    const storage = memory()
    storage.setItem(
      OPTIONS_STORAGE_KEY,
      JSON.stringify({ matchSeconds: 90, spawnIntervalSeconds: 1 }),
    )
    expect(readOptions(storage)).toEqual({
      matchSeconds: 60,
      spawnIntervalSeconds: 10,
    })
  })

  it('returns the pair that was written', () => {
    const storage = memory()
    writeOptions(storage, { matchSeconds: 90, spawnIntervalSeconds: 15 })
    expect(readOptions(storage)).toEqual({
      matchSeconds: 90,
      spawnIntervalSeconds: 15,
    })
  })
})
