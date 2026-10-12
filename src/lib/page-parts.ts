import type { Metadata } from 'next'

import { isLexicalState, type LexicalState } from '@/lib/lexical'
import type { Page } from '@/payload-types'

type Block = Page['blocks'][number]
export type HeroBlock = Extract<Block, { blockType: 'hero' }>
export type RichTextBlock = Extract<Block, { blockType: 'richText' }>
export type ExtraBlock = Exclude<Block, HeroBlock | RichTextBlock>

/** Splits a CMS page into the pieces the custom page layouts use. */
export function pageParts(page: Page): {
  hero: HeroBlock | undefined
  texts: LexicalState[]
  extras: ExtraBlock[]
} {
  const hero = page.blocks.find((block): block is HeroBlock => block.blockType === 'hero')
  const texts = page.blocks
    .filter((block): block is RichTextBlock => block.blockType === 'richText')
    .map((block) => block.content)
    .filter(isLexicalState)
  const extras = page.blocks.filter((block): block is ExtraBlock => {
    return block.blockType !== 'hero' && block.blockType !== 'richText'
  })
  return { hero, texts, extras }
}

/** Page metadata from the SEO group, with fallbacks for anything left blank. */
export function pageMetadata(
  page: Page | null,
  fallback: { title: string; description: string; path: string },
): Metadata {
  return {
    title: page?.meta?.title || fallback.title,
    description: page?.meta?.description || fallback.description,
    alternates: { canonical: fallback.path },
  }
}
