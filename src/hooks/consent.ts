import {
  APIError,
  type CollectionBeforeChangeHook,
  type Field,
  type GlobalBeforeChangeHook,
  type PayloadRequest,
} from 'payload'

type ConsentCollection = 'media' | 'team'
type Ref = { collection: ConsentCollection; id: string | number }
type Data = Record<string, unknown>

const CONSENT_COLLECTIONS: readonly string[] = ['media', 'team']

const isConsentCollection = (value: unknown): value is ConsentCollection =>
  typeof value === 'string' && CONSENT_COLLECTIONS.includes(value)

function idOf(value: unknown): string | number | undefined {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return id
  }
  return undefined
}

/** Finds upload nodes embedded in Lexical rich text. */
function scanRichText(node: unknown, refs: Ref[]): void {
  if (Array.isArray(node)) {
    for (const child of node) scanRichText(child, refs)
    return
  }
  if (!node || typeof node !== 'object') return
  const record = node as Data
  if (record.type === 'upload' && isConsentCollection(record.relationTo)) {
    const id = idOf(record.value)
    if (id !== undefined) refs.push({ collection: record.relationTo, id })
  }
  for (const value of Object.values(record)) scanRichText(value, refs)
}

/** Walks the field schema alongside the data and collects every media and team reference. */
function collectRefs(fields: Field[], data: Data | undefined, refs: Ref[]): void {
  if (!data) return
  for (const field of fields) {
    switch (field.type) {
      case 'row':
      case 'collapsible':
        collectRefs(field.fields, data, refs)
        break
      case 'tabs':
        for (const tab of field.tabs) {
          collectRefs(
            tab.fields,
            'name' in tab && tab.name ? (data[tab.name] as Data | undefined) : data,
            refs,
          )
        }
        break
      case 'group':
        collectRefs(
          field.fields,
          'name' in field && field.name ? (data[field.name] as Data | undefined) : data,
          refs,
        )
        break
      case 'array':
        for (const row of (data[field.name] as Data[] | undefined) ?? []) {
          collectRefs(field.fields, row, refs)
        }
        break
      case 'blocks':
        for (const row of (data[field.name] as Data[] | undefined) ?? []) {
          const block = field.blocks.find(
            (candidate) => typeof candidate !== 'string' && candidate.slug === row.blockType,
          )
          if (block && typeof block !== 'string') collectRefs(block.fields, row, refs)
        }
        break
      case 'relationship':
      case 'upload': {
        const value = data[field.name]
        const items = Array.isArray(value) ? value : [value]
        for (const item of items) {
          if (typeof field.relationTo === 'string') {
            const id = idOf(item)
            if (isConsentCollection(field.relationTo) && id !== undefined) {
              refs.push({ collection: field.relationTo, id })
            }
          } else if (item && typeof item === 'object' && 'relationTo' in item) {
            const poly = item as { relationTo: unknown; value: unknown }
            const id = idOf(poly.value)
            if (isConsentCollection(poly.relationTo) && id !== undefined) {
              refs.push({ collection: poly.relationTo, id })
            }
          }
        }
        break
      }
      case 'richText':
        scanRichText(data[field.name], refs)
        break
      default:
        break
    }
  }
}

async function assertConsent(args: {
  fields: Field[]
  data: Data
  original: Data | undefined
  req: PayloadRequest
  label: string
}): Promise<void> {
  const { fields, data, original, req, label } = args
  const refs: Ref[] = []
  collectRefs(fields, { ...(original ?? {}), ...data }, refs)

  const seen = new Set<string>()
  const missing: string[] = []
  for (const ref of refs) {
    const key = `${ref.collection}:${ref.id}`
    if (seen.has(key)) continue
    seen.add(key)
    const found = await req.payload.findByID({
      collection: ref.collection,
      id: ref.id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
      req,
    })
    if (!found || found.consentOnFile !== true) {
      const name =
        found && 'alt' in found ? found.alt : found && 'name' in found ? found.name : undefined
      missing.push(`${ref.collection} "${name ?? ref.id}"`)
    }
  }

  if (missing.length > 0) {
    throw new APIError(
      `Cannot publish ${label}: consent on file is not ticked for ${missing.join(', ')}.`,
      400,
      undefined,
      true,
    )
  }
}

type Options = {
  /** Skip the check for this data (for example a team entry that is not yet public). */
  skip?: (merged: Data) => boolean
}

/**
 * Blocks publishing a document that references media or team entries without consentOnFile.
 * Draft-enabled collections are checked only when the save publishes; collections without drafts
 * are public on save, so every save is checked.
 */
export const requireConsentOnPublish =
  (options: Options = {}): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req, collection }) => {
    const hasDrafts = Boolean(collection.versions?.drafts)
    if (hasDrafts && data._status !== 'published') return data
    const merged = { ...(originalDoc ?? {}), ...data } as Data
    if (options.skip?.(merged)) return data
    await assertConsent({
      fields: collection.fields,
      data,
      original: originalDoc as Data | undefined,
      req,
      label: collection.slug,
    })
    return data
  }

export const requireGlobalConsentOnPublish: GlobalBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  global,
}) => {
  const hasDrafts = Boolean(global.versions?.drafts)
  if (hasDrafts && data._status !== 'published') return data
  await assertConsent({
    fields: global.fields,
    data,
    original: originalDoc as Data | undefined,
    req,
    label: global.slug,
  })
  return data
}
