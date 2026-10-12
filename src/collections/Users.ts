import type { CollectionConfig } from 'payload'

import {
  ROLES,
  hasRole,
  hiddenUnless,
  isSuperAdmin,
  selfOrSuperAdmin,
  superAdminField,
  superAdminOnly,
} from '@/access'
import { auditAfterChange, auditAfterDelete } from '@/hooks/audit'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'User', plural: 'Users' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Settings',
    hidden: hiddenUnless('super-admin'),
  },
  auth: {
    // FR-CMS-01: sessions last 8 hours (the admin refreshes the token while someone is active),
    // and 5 failed sign-ins lock the account for 15 minutes.
    tokenExpiration: 8 * 60 * 60,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    admin: ({ req: { user } }) => hasRole(user, ...ROLES),
    create: superAdminOnly,
    read: selfOrSuperAdmin,
    update: selfOrSuperAdmin,
    delete: superAdminOnly,
    unlock: superAdminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'viewer',
      saveToJWT: true,
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Contributor', value: 'contributor' },
        { label: 'Viewer', value: 'viewer' },
      ],
      // Only a super-admin can grant or change a role. Nobody can promote themselves.
      access: { create: superAdminField, update: superAdminField },
      hooks: {
        beforeValidate: [
          async ({ value, operation, req }) => {
            // The first account created through the admin becomes the super-admin.
            if (operation !== 'create') return value
            const { totalDocs } = await req.payload.count({
              collection: 'users',
              overrideAccess: true,
              req,
            })
            return totalDocs === 0 ? 'super-admin' : value
          },
        ],
      },
      admin: {
        description:
          'Super Admin: everything. Editor: publishes content. Contributor: drafts only. Viewer: reads form submissions and donations.',
        condition: (_data, _sibling, { user }) => isSuperAdmin(user) || !user,
      },
    },
  ],
  hooks: {
    afterChange: [auditAfterChange],
    afterDelete: [auditAfterDelete],
  },
}
