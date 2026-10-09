import { describe, expect, it } from 'vitest'
import {
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  validateEmailChange,
  validateNewPassword,
} from './accountSettings'

describe('normalizeEmail', () => {
  it('lowercases and trims to match signup', () => {
    expect(normalizeEmail('  Maya.Chen@Example.COM ')).toBe('maya.chen@example.com')
  })
})

describe('validateEmailChange', () => {
  it('accepts a well-formed, different address', () => {
    expect(validateEmailChange('old@example.com', 'new@example.com')).toBeNull()
  })

  it('requires a value', () => {
    expect(validateEmailChange('old@example.com', '   ')).toBe('Enter your new email address.')
  })

  it('rejects an obviously malformed address', () => {
    expect(validateEmailChange('old@example.com', 'not-an-email')).toBe(
      'Please enter a valid email address.',
    )
  })

  it('rejects a no-op change to the same address (case-insensitive)', () => {
    expect(validateEmailChange('Maya@Example.com', 'maya@example.com')).toBe(
      'That is already your email address.',
    )
  })

  it('still validates when there is no current email', () => {
    expect(validateEmailChange(null, 'new@example.com')).toBeNull()
  })
})

describe('validateNewPassword', () => {
  it('accepts a long-enough matching password', () => {
    expect(validateNewPassword('hunter2', 'hunter2')).toBeNull()
  })

  it('rejects passwords shorter than the signup minimum', () => {
    expect(validateNewPassword('short', 'short')).toBe(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    )
  })

  it('rejects a mismatched confirmation', () => {
    expect(validateNewPassword('hunter2', 'hunter3')).toBe('Passwords do not match.')
  })

  it('uses 6 as the minimum length (identical to signup + SetPasswordCard)', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(6)
  })
})
