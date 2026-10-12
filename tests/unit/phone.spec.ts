// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { normaliseKenyanPhone } from '@/lib/phone'

describe('normaliseKenyanPhone', () => {
  describe('accepts every common way of writing a Kenyan mobile number', () => {
    it.each([
      // 07XX
      ['0712345678', '254712345678'],
      ['0722 500 197', '254722500197'],
      ['0799-123-456', '254799123456'],
      // 01XX
      ['0112345678', '254112345678'],
      ['0110 123 456', '254110123456'],
      // +2547XX / +2541XX
      ['+254712345678', '254712345678'],
      ['+254 712 345 678', '254712345678'],

      ['+254112345678', '254112345678'],
      // 2547XX / 2541XX
      ['254712345678', '254712345678'],
      ['254 712 345 678', '254712345678'],
      ['254112345678', '254112345678'],
      // nine digits, brackets and dots
      ['712345678', '254712345678'],
      ['112345678', '254112345678'],
      ['(0712) 345.678', '254712345678'],
      ['  0712345678  ', '254712345678'],
    ])('%s -> %s', (input, expected) => {
      expect(normaliseKenyanPhone(input)).toBe(expected)
    })
  })

  describe('returns only 2547XXXXXXXX or 2541XXXXXXXX', () => {
    it('always gives 12 digits starting 2547 or 2541', () => {
      for (const input of ['0712345678', '+254112345678', '254799999999', '0101010101']) {
        expect(normaliseKenyanPhone(input)).toMatch(/^254[71]\d{8}$/)
      }
    })
  })

  describe('rejects anything else', () => {
    it.each([
      '',
      '   ',
      'abc',
      '12345',
      '0212345678', // landline style
      '0312345678',
      '0812345678',
      '0912345678',
      '07123456', // too short
      '071234567890', // too long
      '+44 7700 900123', // another country
      '+255 712 345 678', // Tanzania
      '254212345678',
      '2547123456789',
      '0712 345 67a',
    ])('rejects %j', (input) => {
      expect(normaliseKenyanPhone(input)).toBeNull()
    })
  })

  it('gives the same result for the same number written differently', () => {
    const forms = ['0712345678', '+254712345678', '254712345678', '712345678', '0712 345 678']
    expect(new Set(forms.map(normaliseKenyanPhone)).size).toBe(1)
  })
})
