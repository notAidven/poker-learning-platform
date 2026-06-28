import { describe, expect, it } from 'vitest'
import { looksLikeEmail, planPasswordReset } from './resetIdentifier'

describe('looksLikeEmail', () => {
  it('treats any value containing "@" as an email (usernames can never contain @)', () => {
    expect(looksLikeEmail('maya@example.com')).toBe(true)
    expect(looksLikeEmail('maya')).toBe(false)
    expect(looksLikeEmail('maya_99')).toBe(false)
  })
})

describe('planPasswordReset', () => {
  it('returns "empty" for blank or whitespace-only input', () => {
    expect(planPasswordReset('')).toEqual({ kind: 'empty' })
    expect(planPasswordReset('   ')).toEqual({ kind: 'empty' })
  })

  it('plans a direct email send when the input is an email (trimmed + lowercased)', () => {
    expect(planPasswordReset('maya@example.com')).toEqual({
      kind: 'email',
      email: 'maya@example.com',
    })
    expect(planPasswordReset('  Maya@Example.COM  ')).toEqual({
      kind: 'email',
      email: 'maya@example.com',
    })
  })

  it('plans a username→email lookup otherwise (trimmed, case preserved for the lookup)', () => {
    expect(planPasswordReset('maya')).toEqual({ kind: 'username', username: 'maya' })
    expect(planPasswordReset('  Maya_99  ')).toEqual({
      kind: 'username',
      username: 'Maya_99',
    })
  })
})
