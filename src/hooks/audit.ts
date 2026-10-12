import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

type AuditAction = 'create' | 'update' | 'publish' | 'delete'

type AuditDoc = {
  id?: number | string
  _status?: string | null
  title?: string | null
  name?: string | null
  email?: string | null
  slug?: string | null
}

const labelOf = (doc: AuditDoc): string =>
  doc.title ?? doc.name ?? doc.email ?? doc.slug ?? (doc.id !== undefined ? String(doc.id) : '')

async function record(
  req: PayloadRequest,
  entry: { action: AuditAction; collection: string; docId: string; docLabel: string },
): Promise<void> {
  // Only signed-in staff actions are audited. Public form posts and system jobs are not.
  if (!req.user || req.context.skipAudit) return
  // Autosave fires every few seconds while editing; it is not a user action.
  if (req.query?.autosave === 'true') return

  await req.payload.create({
    collection: 'audit-log',
    data: {
      ...entry,
      user: req.user.id,
      userEmail: req.user.email,
    },
    req,
    overrideAccess: true,
  })
}

export const auditAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  collection,
  req,
}) => {
  const published = doc._status === 'published' && previousDoc?._status !== 'published'
  const action: AuditAction = operation === 'create' ? 'create' : published ? 'publish' : 'update'
  await record(req, {
    action,
    collection: collection.slug,
    docId: String(doc.id),
    docLabel: labelOf(doc as AuditDoc),
  })
  return doc
}

export const auditAfterDelete: CollectionAfterDeleteHook = async ({ doc, id, collection, req }) => {
  await record(req, {
    action: 'delete',
    collection: collection.slug,
    docId: String(id),
    docLabel: labelOf(doc as AuditDoc),
  })
  return doc
}

export const auditGlobalAfterChange: GlobalAfterChangeHook = async ({
  doc,
  previousDoc,
  global,
  req,
}) => {
  const published = doc._status === 'published' && previousDoc?._status !== 'published'
  await record(req, {
    action: published ? 'publish' : 'update',
    collection: `global:${global.slug}`,
    docId: global.slug,
    docLabel: global.slug,
  })
  return doc
}
