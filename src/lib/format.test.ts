import { describe, expect, it } from 'vitest'
import { formatName } from '@/lib/format'

describe('formatName', () => {
  it('joins first and last name with a single space', () => {
    expect(formatName('Ada', 'Lovelace')).toBe('Ada Lovelace')
  })

  it('trims surrounding whitespace from each part', () => {
    expect(formatName('  Ada  ', '  Lovelace  ')).toBe('Ada Lovelace')
  })

  it('returns an empty string when both inputs are empty', () => {
    expect(formatName('', '')).toBe('')
  })
})
