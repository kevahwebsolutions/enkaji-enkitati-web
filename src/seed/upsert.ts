import type { CollectionSlug, GlobalSlug, Payload, Where } from 'payload'

import { containsSeed } from './compare'

export type Outcome = 'created' | 'updated' | 'unchanged' | 'kept'

export type SeedContext = {
  payload: Payload
  /** Replace records even when someone has edited them in the admin. */
  overwrite: boolean
  tally: Map<string, Record<Outcome, number>>
}

// Seed data is validated by Payload when it is saved, so the local API calls take it untyped.
type SeedData = Record<string, unknown>

export function record(ctx: SeedContext, label: string, outcome: Outcome): void {
  const row = ctx.tally.get(label) ?? { created: 0, updated: 0, unchanged: 0, kept: 0 }
  row[outcome] += 1
  ctx.tally.set(label, row)
}

/**
 * The audit log records every signed-in admin action, so any entry for a document means a person
 * has touched it since it was seeded. The seed never overwrites that work.
 */
async function editedInAdmin(
  ctx: SeedContext,
  auditCollection: string,
  docId: string | number,
): Promise<boolean> {
  const { totalDocs } = await ctx.payload.count({
    collection: 'audit-log',
    where: {
      and: [{ collection: { equals: auditCollection } }, { docId: { equals: String(docId) } }],
    },
    overrideAccess: true,
  })
  return totalDocs > 0
}

const context = { disableRevalidate: true }

export async function upsertDoc(
  ctx: SeedContext,
  collection: CollectionSlug,
  where: Where,
  data: SeedData,
  options: { draft?: boolean } = {},
): Promise<{ id: number; outcome: Outcome }> {
  const { payload } = ctx
  const { draft } = options
  const found = await payload.find({
    collection,
    where,
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  const existing = found.docs[0] as unknown as (SeedData & { id: number }) | undefined

  if (!existing) {
    const created = await payload.create({
      collection,
      data: data as never,
      context,
      draft,
      overrideAccess: true,
    })
    record(ctx, collection, 'created')
    return { id: (created as { id: number }).id, outcome: 'created' }
  }

  if (containsSeed(existing, data)) {
    record(ctx, collection, 'unchanged')
    return { id: existing.id, outcome: 'unchanged' }
  }

  if (!ctx.overwrite && (await editedInAdmin(ctx, collection, existing.id))) {
    record(ctx, collection, 'kept')
    return { id: existing.id, outcome: 'kept' }
  }

  await payload.update({
    collection,
    id: existing.id,
    data: data as never,
    context,
    draft,
    overrideAccess: true,
  })
  record(ctx, collection, 'updated')
  return { id: existing.id, outcome: 'updated' }
}

export async function upsertGlobal(
  ctx: SeedContext,
  slug: GlobalSlug,
  data: SeedData,
): Promise<Outcome> {
  const { payload } = ctx
  const existing = (await payload.findGlobal({
    slug,
    depth: 0,
    overrideAccess: true,
  })) as unknown as SeedData

  let outcome: Outcome
  if (containsSeed(existing, data)) {
    outcome = 'unchanged'
  } else if (!ctx.overwrite && (await editedInAdmin(ctx, `global:${slug}`, slug))) {
    outcome = 'kept'
  } else {
    await payload.updateGlobal({
      slug,
      data: data as never,
      context,
      overrideAccess: true,
    })
    outcome = 'updated'
  }
  record(ctx, `global:${slug}`, outcome)
  return outcome
}
