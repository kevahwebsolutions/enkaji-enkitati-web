/**
 * Normalises a Kenyan mobile number to 2547XXXXXXXX or 2541XXXXXXXX (FR-FRM-02). Accepts the
 * local form (07XX XXX XXX), the international form with or without a plus sign, and the bare
 * nine digits, with spaces, dashes or brackets. Returns null for anything else.
 */
export function normaliseKenyanPhone(input: string): string | null {
  const compact = input.replace(/[\s().-]/g, '')
  const match = /^(?:\+?254|0)?([71]\d{8})$/.exec(compact)
  return match ? `254${match[1]}` : null
}
