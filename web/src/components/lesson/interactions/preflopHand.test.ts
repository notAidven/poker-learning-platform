import { describe, expect, it } from 'vitest'
import { gradePreflopHand } from './preflopHand'
import type { PreflopHandConfig } from '../../../types/lesson'

const classify: PreflopHandConfig = { mode: 'classify' }
const pickStronger: PreflopHandConfig = { mode: 'pick-stronger' }

describe('gradePreflopHand', () => {
  it('classify: matches the authored option id', () => {
    expect(gradePreflopHand(classify, { optionId: 'premium' }, { optionId: 'premium', side: null })).toBe(true)
    expect(gradePreflopHand(classify, { optionId: 'premium' }, { optionId: 'weak', side: null })).toBe(false)
    expect(gradePreflopHand(classify, { optionId: 'premium' }, { optionId: null, side: null })).toBe(false)
  })

  it('pick-stronger: matches the authored stronger side, including a tie', () => {
    expect(gradePreflopHand(pickStronger, { stronger: 'a' }, { optionId: null, side: 'a' })).toBe(true)
    expect(gradePreflopHand(pickStronger, { stronger: 'a' }, { optionId: null, side: 'b' })).toBe(false)
    expect(gradePreflopHand(pickStronger, { stronger: 'tie' }, { optionId: null, side: 'tie' })).toBe(true)
    expect(gradePreflopHand(pickStronger, { stronger: 'a' }, { optionId: null, side: null })).toBe(false)
  })
})
