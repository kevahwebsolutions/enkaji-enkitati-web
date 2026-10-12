// @vitest-environment node
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import type { User } from '@/payload-types'

type Role = NonNullable<User['role']>
type AuthedUser = User & { collection: 'users' }

const run = Date.now()
const password = 'Test-password-123'
const logo = path.resolve(process.cwd(), 'public/brand/logo-mark.png')

let payload: Payload
const users = {} as Record<Role, AuthedUser>
const created: {
  collection: 'programs' | 'posts' | 'media' | 'team' | 'form-submissions'
  id: number
}[] = []

const email = (role: string) => `access-${role}-${run}@example.test`

async function track<T extends { id: number }>(
  collection: (typeof created)[number]['collection'],
  doc: T,
): Promise<T> {
  created.push({ collection, id: doc.id })
  return doc
}

const draftProgram = (title: string) => ({
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  icon: 'Sprout',
  summary: 'Access test program',
})

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  for (const role of ['super-admin', 'editor', 'contributor', 'viewer'] as const) {
    const doc = await payload.create({
      collection: 'users',
      data: { name: `Test ${role}`, email: email(role), password, role },
      overrideAccess: true,
    })
    users[role] = { ...doc, collection: 'users' }
  }
}, 120_000)

afterAll(async () => {
  for (const { collection, id } of created.reverse()) {
    await payload.delete({ collection, id, overrideAccess: true }).catch(() => undefined)
  }
  await payload.delete({
    collection: 'users',
    where: { email: { contains: `-${run}@example.test` } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'audit-log',
    where: { userEmail: { contains: `-${run}@example.test` } },
    overrideAccess: true,
  })
})

describe('content roles', () => {
  it('lets super-admin, editor and contributor create, and refuses viewer', async () => {
    for (const role of ['super-admin', 'editor', 'contributor'] as const) {
      const doc = await payload.create({
        collection: 'programs',
        data: draftProgram(`Create by ${role} ${run}`),
        user: users[role],
        overrideAccess: false,
      })
      await track('programs', doc)
    }
    await expect(
      payload.create({
        collection: 'programs',
        data: draftProgram(`Create by viewer ${run}`),
        user: users.viewer,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('forces a contributor to save a draft even when asking to publish', async () => {
    const doc = await payload.create({
      collection: 'programs',
      data: { ...draftProgram(`Contributor publish ${run}`), _status: 'published' },
      user: users.contributor,
      overrideAccess: false,
    })
    await track('programs', doc)
    expect(doc._status).toBe('draft')
  })

  it('lets an editor publish and the public then see only published documents', async () => {
    const draft = await track(
      'programs',
      await payload.create({
        collection: 'programs',
        data: draftProgram(`Hidden draft ${run}`),
        draft: true,
        overrideAccess: true,
      }),
    )
    const live = await track(
      'programs',
      await payload.create({
        collection: 'programs',
        data: { ...draftProgram(`Live program ${run}`), _status: 'published' },
        user: users.editor,
        overrideAccess: false,
      }),
    )
    expect(live._status).toBe('published')

    const publicList = await payload.find({
      collection: 'programs',
      where: { title: { contains: String(run) } },
      overrideAccess: false,
    })
    const titles = publicList.docs.map((d) => d.title)
    expect(titles).toContain(live.title)
    expect(titles).not.toContain(draft.title)
  })

  it('lets a contributor edit only their own unpublished drafts', async () => {
    const own = await track(
      'programs',
      await payload.create({
        collection: 'programs',
        data: draftProgram(`Own draft ${run}`),
        user: users.contributor,
        overrideAccess: false,
      }),
    )
    const updated = await payload.update({
      collection: 'programs',
      id: own.id,
      data: { summary: 'Edited by the contributor' },
      user: users.contributor,
      overrideAccess: false,
    })
    expect(updated.summary).toBe('Edited by the contributor')

    const others = await track(
      'programs',
      await payload.create({
        collection: 'programs',
        data: draftProgram(`Editor draft ${run}`),
        user: users.editor,
        overrideAccess: false,
      }),
    )
    await expect(
      payload.update({
        collection: 'programs',
        id: others.id,
        data: { summary: 'Not allowed' },
        user: users.contributor,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('lets only super-admins delete', async () => {
    const doc = await track(
      'programs',
      await payload.create({
        collection: 'programs',
        data: draftProgram(`Delete me ${run}`),
        overrideAccess: true,
      }),
    )
    for (const role of ['editor', 'contributor', 'viewer'] as const) {
      await expect(
        payload.delete({
          collection: 'programs',
          id: doc.id,
          user: users[role],
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    }
    await expect(
      payload.delete({
        collection: 'programs',
        id: doc.id,
        user: users['super-admin'],
        overrideAccess: false,
      }),
    ).resolves.toBeDefined()
  })
})

describe('engagement records', () => {
  it('lets super-admin, editor and viewer read submissions; contributor and public cannot', async () => {
    const submission = await track(
      'form-submissions',
      await payload.create({
        collection: 'form-submissions',
        data: { formType: 'contact', data: { message: 'hello' }, consent: true },
        overrideAccess: true,
      }),
    )
    for (const role of ['super-admin', 'editor', 'viewer'] as const) {
      await expect(
        payload.findByID({
          collection: 'form-submissions',
          id: submission.id,
          user: users[role],
          overrideAccess: false,
        }),
      ).resolves.toBeDefined()
    }
    await expect(
      payload.findByID({
        collection: 'form-submissions',
        id: submission.id,
        user: users.contributor,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.findByID({
        collection: 'form-submissions',
        id: submission.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('refuses to create submissions through access-controlled calls', async () => {
    await expect(
      payload.create({
        collection: 'form-submissions',
        data: { formType: 'contact', data: {}, consent: true },
        user: users['super-admin'],
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})

describe('users and roles', () => {
  it('limits users to reading themselves unless super-admin', async () => {
    const asEditor = await payload.find({
      collection: 'users',
      where: { email: { contains: `-${run}@example.test` } },
      user: users.editor,
      overrideAccess: false,
    })
    expect(asEditor.docs.map((d) => d.id)).toEqual([users.editor.id])

    const asAdmin = await payload.find({
      collection: 'users',
      where: { email: { contains: `-${run}@example.test` } },
      user: users['super-admin'],
      overrideAccess: false,
    })
    expect(asAdmin.totalDocs).toBe(4)
  })

  it('stops anyone but a super-admin changing a role', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: users.contributor.id,
      data: { role: 'super-admin' },
      user: users.contributor,
      overrideAccess: false,
    })
    expect(updated.role).toBe('contributor')
  })

  it('locks an account for 15 minutes after 5 failed sign-ins', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(
        payload.login({
          collection: 'users',
          data: { email: email('viewer'), password: 'wrong-password' },
        }),
      ).rejects.toThrow()
    }
    await expect(
      payload.login({ collection: 'users', data: { email: email('viewer'), password } }),
    ).rejects.toThrow(/locked/i)
  }, 30_000)
})

describe('site settings', () => {
  it('keeps payment fields away from everyone but super-admins', async () => {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { paybill: '123456', accountNumber: '0001112223', donateEnabled: true },
      user: users['super-admin'],
      overrideAccess: false,
    })

    const asAdmin = await payload.findGlobal({
      slug: 'site-settings',
      user: users['super-admin'],
      overrideAccess: false,
    })
    expect(asAdmin.paybill).toBe('123456')

    for (const reader of [users.editor, undefined]) {
      const view = await payload.findGlobal({
        slug: 'site-settings',
        user: reader,
        overrideAccess: false,
      })
      expect(view.paybill).toBeUndefined()
      expect(view.accountNumber).toBeUndefined()
      expect(view.donateEnabled).toBeUndefined()
      expect(view.phone).toBe('+254 721 500197')
    }

    await payload.updateGlobal({
      slug: 'site-settings',
      data: { paybill: '999999', location: 'Narok, Kenya' },
      user: users.editor,
      overrideAccess: false,
    })
    const after = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
    expect(after.paybill).toBe('123456')

    await payload.updateGlobal({
      slug: 'site-settings',
      data: { paybill: null, accountNumber: null, donateEnabled: false },
      overrideAccess: true,
    })
  })
})

describe('consent on file', () => {
  it('blocks publishing content that references media without consent, then allows it', async () => {
    const media = await track(
      'media',
      await payload.create({
        collection: 'media',
        data: { alt: 'Access test image' },
        filePath: logo,
        overrideAccess: true,
      }),
    )
    const base = {
      title: `Consent post ${run}`,
      slug: `consent-post-${run}`,
      excerpt: 'Consent test',
      body: {
        root: {
          type: 'root',
          version: 1,
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          children: [
            {
              type: 'paragraph',
              version: 1,
              direction: 'ltr' as const,
              format: '' as const,
              indent: 0,
              textFormat: 0,
              children: [
                {
                  type: 'text',
                  version: 1,
                  text: 'Consent test body',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                },
              ],
            },
          ],
        },
      },
      category: 'News' as const,
      cover: media.id,
    }
    const post = await track(
      'posts',
      await payload.create({ collection: 'posts', data: base, draft: true, overrideAccess: true }),
    )
    await expect(
      payload.update({
        collection: 'posts',
        id: post.id,
        data: { _status: 'published' },
        user: users.editor,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/consent on file/i)

    await payload.update({
      collection: 'media',
      id: media.id,
      data: { consentOnFile: true },
      user: users.editor,
      overrideAccess: false,
    })
    const published = await payload.update({
      collection: 'posts',
      id: post.id,
      data: { _status: 'published' },
      user: users.editor,
      overrideAccess: false,
    })
    expect(published._status).toBe('published')
  })

  it('hides unconsented media and team entries from the public', async () => {
    const hidden = await track(
      'team',
      await payload.create({
        collection: 'team',
        data: { name: `Hidden member ${run}`, role: 'Tester', consentOnFile: false },
        overrideAccess: true,
      }),
    )
    const publicView = await payload.find({
      collection: 'team',
      where: { id: { equals: hidden.id } },
      overrideAccess: false,
    })
    expect(publicView.totalDocs).toBe(0)
  })
})

describe('placeholders and audit', () => {
  it('clears the placeholder flag when real content replaces it', async () => {
    const doc = await track(
      'programs',
      await payload.create({
        collection: 'programs',
        data: { ...draftProgram(`Placeholder ${run}`), isPlaceholder: true, _status: 'published' },
        overrideAccess: true,
      }),
    )
    expect(doc.isPlaceholder).toBe(true)
    const updated = await payload.update({
      collection: 'programs',
      id: doc.id,
      data: { summary: 'Real summary written by the team', _status: 'published' },
      user: users.editor,
      overrideAccess: false,
    })
    expect(updated.isPlaceholder).toBe(false)
  })

  it('records signed-in actions in the audit log', async () => {
    const doc = await track(
      'programs',
      await payload.create({
        collection: 'programs',
        data: draftProgram(`Audited ${run}`),
        user: users.editor,
        overrideAccess: false,
      }),
    )
    const log = await payload.find({
      collection: 'audit-log',
      where: {
        and: [{ docId: { equals: String(doc.id) } }, { collection: { equals: 'programs' } }],
      },
      overrideAccess: true,
    })
    expect(log.docs[0]?.action).toBe('create')
    expect(log.docs[0]?.userEmail).toBe(email('editor'))
  })
})
