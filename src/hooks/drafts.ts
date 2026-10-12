import type { CollectionBeforeChangeHook, GlobalBeforeChangeHook } from 'payload'

import { canPublish } from '@/access'

/**
 * Only editors and super-admins publish. Anyone else signed in (contributors) is forced to save a
 * draft, whatever the request asked for. Jobs and scripts run without a user and are unaffected.
 */
export const forceDraftUnlessPublisher: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.user && !canPublish(req.user)) data._status = 'draft'
  return data
}

export const forceGlobalDraftUnlessPublisher: GlobalBeforeChangeHook = ({ data, req }) => {
  if (req.user && !canPublish(req.user)) data._status = 'draft'
  return data
}

/** Records the creator so contributors can keep editing their own unpublished drafts. */
export const setCreatedBy: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation === 'create' && req.user) data.createdBy = req.user.id
  return data
}
