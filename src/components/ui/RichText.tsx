import {
  RichText as PayloadRichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import Link from 'next/link'

import type { LexicalState } from '@/lib/lexical'
import { cn } from '@/lib/utils'

type LinkFields = { url?: string | null; newTab?: boolean | null; linkType?: string }
type LinkLike = { fields?: LinkFields; children?: unknown[] }

const YOUTUBE_ID = /(?:v=|youtu\.be\/|embed\/)([\w-]{11})/

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  // Internal links go through next/link; links to other sites open safely in a new tab.
  link: ({ node, nodesToJSX }) => {
    const { fields, children } = node as unknown as LinkLike
    const href = fields?.url ?? '#'
    const content = nodesToJSX({ nodes: (children ?? []) as never })
    if (href.startsWith('/')) return <Link href={href}>{content}</Link>
    return (
      <a href={href} target={fields?.newTab ? '_blank' : undefined} rel="noopener noreferrer">
        {content}
      </a>
    )
  },
  blocks: {
    // Privacy-enhanced YouTube embed (FR-CMS-06): no cookies until the video is played.
    youtube: ({ node }: { node: { fields: Record<string, unknown> } }) => {
      const { url, title } = node.fields as { url?: string; title?: string }
      const id = url ? YOUTUBE_ID.exec(url)?.[1] : undefined
      if (!id) return null
      return (
        <div className="my-6 aspect-video overflow-hidden rounded-xl">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title={title ?? 'YouTube video'}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        </div>
      )
    },
  },
})

/** Renders CMS rich text. Wrap long text in `Prose` or `prose-longform` for typography. */
export function RichText({ data, className }: { data: LexicalState; className?: string }) {
  return (
    <PayloadRichText
      data={data as never}
      converters={converters}
      className={cn('payload-richtext', className)}
    />
  )
}
