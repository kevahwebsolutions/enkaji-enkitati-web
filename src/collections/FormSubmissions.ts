import type { CollectionConfig, Endpoint, Where } from 'payload'

import {
  canReadEngagement,
  engagementReaders,
  hiddenUnless,
  nobody,
  superAdminOnly,
} from '@/access'
import { toCsv } from '@/lib/csv'
import { auditAfterDelete } from '@/hooks/audit'

/** Columns that come first in an export; any other keys found in the data follow, alphabetically. */
const LEADING_COLUMNS = ['id', 'createdAt', 'formType', 'consent', 'emailStatus']

/**
 * CSV export (FR-FRM-06). It reads through the user's own access rules, only roles that can read
 * submissions may download them, and every export is written to the audit log.
 */
const exportCsv: Endpoint = {
  path: '/export.csv',
  method: 'get',
  handler: async (req) => {
    if (!req.user || !canReadEngagement(req.user)) {
      return new Response('Forbidden', { status: 403 })
    }
    const formType = req.searchParams.get('formType')
    const where: Where = formType ? { formType: { equals: formType } } : {}

    const { docs } = await req.payload.find({
      collection: 'form-submissions',
      where,
      sort: '-createdAt',
      limit: 100_000,
      depth: 0,
      pagination: false,
      user: req.user,
      overrideAccess: false,
    })

    const rows = docs.map((doc) => ({
      id: doc.id,
      createdAt: doc.createdAt,
      formType: doc.formType,
      consent: doc.consent,
      emailStatus: doc.emailStatus ?? '',
      ...(typeof doc.data === 'object' && doc.data && !Array.isArray(doc.data) ? doc.data : {}),
    })) as Array<Record<string, unknown>>

    const dataColumns = [...new Set(rows.flatMap((row) => Object.keys(row)))]
      .filter((key) => !LEADING_COLUMNS.includes(key))
      .sort()
    const csv = toCsv([...LEADING_COLUMNS, ...dataColumns], rows)

    await req.payload.create({
      collection: 'audit-log',
      data: {
        action: 'export',
        collection: 'form-submissions',
        docId: 'export',
        docLabel: `${rows.length} rows${formType ? `, ${formType}` : ''}`,
        user: req.user.id,
        userEmail: req.user.email,
      },
      overrideAccess: true,
    })

    const stamp = new Date().toISOString().slice(0, 10)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="form-submissions-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  },
}

/**
 * Written by server actions through the local API (which bypasses access), so no role can create
 * a submission through the REST or GraphQL API.
 */
export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: { singular: 'Form submission', plural: 'Form submissions' },
  admin: {
    useAsTitle: 'formType',
    defaultColumns: ['formType', 'createdAt', 'emailStatus', 'consent'],
    group: 'Engagement',
    hidden: hiddenUnless('super-admin', 'editor', 'viewer'),
    description:
      'Submissions older than 24 months are deleted automatically (NFR-PRV-05). Use Export to CSV to download them.',
    components: {
      beforeListTable: ['/components/admin/ExportCsvButton#ExportCsvButton'],
    },
  },
  defaultSort: '-createdAt',
  access: {
    read: engagementReaders,
    create: nobody,
    update: nobody,
    delete: superAdminOnly,
  },
  endpoints: [exportCsv],
  fields: [
    {
      name: 'formType',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Contact', value: 'contact' },
        { label: 'Volunteer', value: 'volunteer' },
        { label: 'Partnership enquiry', value: 'partnership' },
        { label: 'School visit request', value: 'school-visit' },
        { label: 'Join the CBO', value: 'join' },
        { label: 'Donation pledge', value: 'pledge' },
        { label: 'Event RSVP', value: 'rsvp' },
        { label: 'Newsletter signup', value: 'newsletter' },
      ],
    },
    { name: 'data', type: 'json', required: true },
    { name: 'consent', type: 'checkbox', required: true, defaultValue: false },
    {
      name: 'emailStatus',
      label: 'Email to the inbox',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed (check the mail settings)', value: 'failed' },
        { label: 'Not sent (mail not configured)', value: 'skipped' },
      ],
      admin: {
        readOnly: true,
        description:
          'Whether the notification email reached the mail server. The submission is saved either way.',
      },
    },
    {
      name: 'ipHash',
      label: 'IP hash',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Salted one-way hash used for rate limiting. The IP itself is never stored.',
      },
    },
  ],
  hooks: { afterDelete: [auditAfterDelete] },
}
