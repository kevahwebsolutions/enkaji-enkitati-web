import 'server-only'

import config from '@payload-config'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

/** The Drizzle database behind Payload, for the few queries Payload's own API cannot express. */
export async function getDb() {
  const payload = await getPayload({ config })
  return (payload.db as unknown as PostgresAdapter).drizzle
}
