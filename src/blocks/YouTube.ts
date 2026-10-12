import type { Block } from 'payload'

const YOUTUBE =
  /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]{11}/

/** Embedded video for rich text (FR-CMS-06). The frontend renders a privacy-enhanced embed. */
export const YouTubeBlock: Block = {
  slug: 'youtube',
  labels: { singular: 'YouTube video', plural: 'YouTube videos' },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      validate: (value: string | null | undefined) =>
        value && YOUTUBE.test(value) ? true : 'Enter a full YouTube link.',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Describes the video for screen reader users.' },
    },
  ],
}
