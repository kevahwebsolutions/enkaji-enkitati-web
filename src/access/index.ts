import type { Access, FieldAccess, Where } from 'payload'

import { canPublish, canReadEngagement, hasRole, isStaff, isSuperAdmin, type Role } from './roles'

export * from './roles'

/** Nobody through the API or admin. Server code uses the local API, which bypasses access. */
export const nobody: Access = () => false

export const superAdminOnly: Access = ({ req: { user } }) => isSuperAdmin(user)

/** Super-admins and editors. */
export const editorsAndAbove: Access = ({ req: { user } }) => canPublish(user)

/** Super-admins, editors and contributors. */
export const staffOnly: Access = ({ req: { user } }) => isStaff(user)

/** Super-admins, editors and viewers (form submissions, donations). */
export const engagementReaders: Access = ({ req: { user } }) => canReadEngagement(user)

/** Everyone can read. Use only for content that is always public. */
export const publicRead: Access = () => true

/** Draft-enabled content: the public sees published documents, staff see everything. */
export const publicReadPublished: Access = ({ req: { user } }) =>
  isStaff(user) ? true : { _status: { equals: 'published' } }

/** Media and team: the public sees only items with consent on file, staff see everything. */
export const publicReadConsented: Access = ({ req: { user } }) =>
  isStaff(user) ? true : { consentOnFile: { equals: true } }

/**
 * Update rule for draft-enabled collections. Editors and super-admins may edit anything.
 * Contributors may edit only documents they created that have never been published.
 */
export const updateOwnDraftOrEditor: Access = ({ req: { user } }) => {
  if (canPublish(user)) return true
  if (hasRole(user, 'contributor') && user?.id !== undefined) {
    const own: Where = {
      and: [{ createdBy: { equals: user.id } }, { _status: { equals: 'draft' } }],
    }
    return own
  }
  return false
}

/** A user may read or change their own record; super-admins may read or change any. */
export const selfOrSuperAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  return { id: { equals: user.id } }
}

/** Field-level: super-admins only. */
export const superAdminField: FieldAccess = ({ req: { user } }) => isSuperAdmin(user)

/** Field-level: editors and super-admins. */
export const editorField: FieldAccess = ({ req: { user } }) => canPublish(user)

/** Field-level: any staff role. */
export const staffField: FieldAccess = ({ req: { user } }) => isStaff(user)

type AdminUser = { role?: string | null } | null | undefined

/** admin.hidden helper: hides the entity from everyone except the listed roles. */
export const hiddenUnless =
  (...allowed: Role[]) =>
  ({ user }: { user: unknown }): boolean =>
    !hasRole(user as AdminUser, ...allowed)
