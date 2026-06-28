import { describe, expect, it } from 'vitest'
import { gradeCompareEvents } from './compareEvents'

describe('gradeCompareEvents', () => {
  it('matches the authored "more likely" choice', () => {
    expect(gradeCompareEvents({ more: 'a' }, 'a')).toBe(true)
    expect(gradeCompareEvents({ more: 'a' }, 'b')).toBe(false)
    expect(gradeCompareEvents({ more: 'equal' }, 'equal')).toBe(true)
    expect(gradeCompareEvents({ more: 'a' }, null)).toBe(false)
  })
})
