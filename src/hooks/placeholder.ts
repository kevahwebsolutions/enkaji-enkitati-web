import type { CollectionBeforeChangeHook } from 'payload'

type Data = Record<string, unknown>

const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)

/** Reduces populated relationships to ids and drops empty values so equal content compares equal. */
function normalise(value: unknown): unknown {
  if (isEmpty(value)) return undefined
  if (Array.isArray(value)) return value.map(normalise)
  if (value && typeof value === 'object') {
    const record = value as Data
    if ('id' in record && 'createdAt' in record) return record.id
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, normalise(record[key])])
        .filter(([, v]) => v !== undefined),
    )
  }
  return value
}

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(normalise(a)) === JSON.stringify(normalise(b))

/**
 * FR-SEED-02: when a signed-in user changes the real content of a placeholder record, the
 * Placeholder flag clears itself. If the user toggled the flag directly, their choice stands.
 */
export const clearPlaceholderOnReplace =
  (contentFields: string[]): CollectionBeforeChangeHook =>
  ({ data, originalDoc, operation, req }) => {
    if (operation !== 'update' || !req.user || !originalDoc?.isPlaceholder) return data
    if (data.isPlaceholder !== undefined && data.isPlaceholder !== originalDoc.isPlaceholder) {
      return data
    }
    const replaced = contentFields.some(
      (field) => field in data && !same(data[field], originalDoc[field]),
    )
    if (replaced) data.isPlaceholder = false
    return data
  }
