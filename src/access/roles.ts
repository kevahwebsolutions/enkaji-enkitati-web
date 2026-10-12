export const ROLES = ['super-admin', 'editor', 'contributor', 'viewer'] as const

export type Role = (typeof ROLES)[number]

/** Minimal shape of a signed-in user as seen by access functions, hooks and admin conditions. */
export type UserLike = { id?: number | string; role?: string | null } | null | undefined

export function hasRole(user: UserLike, ...allowed: Role[]): boolean {
  return Boolean(user && user.role && (allowed as string[]).includes(user.role))
}

export const isSuperAdmin = (user: UserLike): boolean => hasRole(user, 'super-admin')

/** Editors and super-admins: the only roles that may publish. */
export const canPublish = (user: UserLike): boolean => hasRole(user, 'super-admin', 'editor')

/** Roles that may work on content (contributors save drafts only). */
export const isStaff = (user: UserLike): boolean =>
  hasRole(user, 'super-admin', 'editor', 'contributor')

/** Roles that may read form submissions and donation records. */
export const canReadEngagement = (user: UserLike): boolean =>
  hasRole(user, 'super-admin', 'editor', 'viewer')
