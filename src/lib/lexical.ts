/**
 * Small helpers for reading Lexical rich text (the CMS editor format) on the server, so pages can
 * pull sections, lists and plain text out of editor content without a second data model.
 */

export type LexicalNode = {
  type: string
  children?: LexicalNode[]
  text?: string
  tag?: string
  listType?: string
  [key: string]: unknown
}

export type LexicalState = {
  root: { type: string; children: LexicalNode[]; [key: string]: unknown }
  [key: string]: unknown
}

export const isLexicalState = (value: unknown): value is LexicalState =>
  Boolean(
    value &&
    typeof value === 'object' &&
    'root' in value &&
    Array.isArray((value as LexicalState).root?.children),
  )

/** Plain text of a node and everything under it. */
export function nodeText(node: LexicalNode): string {
  if (typeof node.text === 'string') return node.text
  return (node.children ?? []).map(nodeText).join('')
}

export const rootChildren = (state: LexicalState): LexicalNode[] => state.root.children

/** A copy of the state that holds only the given top-level nodes. */
export function withChildren(state: LexicalState, children: LexicalNode[]): LexicalState {
  return { ...state, root: { ...state.root, children } }
}

export type TitledSection = { heading: string; nodes: LexicalNode[] }

/** Splits editor content at its h2 headings. Content before the first h2 is returned as `intro`. */
export function splitAtH2(state: LexicalState): {
  intro: LexicalNode[]
  sections: TitledSection[]
} {
  const intro: LexicalNode[] = []
  const sections: TitledSection[] = []
  for (const node of rootChildren(state)) {
    if (node.type === 'heading' && node.tag === 'h2') {
      sections.push({ heading: nodeText(node), nodes: [] })
    } else if (sections.length > 0) {
      sections[sections.length - 1].nodes.push(node)
    } else {
      intro.push(node)
    }
  }
  return { intro, sections }
}

/** Text of each item in the first list found at the top level. */
export function firstListItems(nodes: LexicalNode[]): string[] {
  const list = nodes.find((node) => node.type === 'list')
  return (list?.children ?? []).map(nodeText).filter(Boolean)
}

/** Intro text and steps for the "Our approach" content: paragraphs before the list, then the list. */
export function splitSteps(state: LexicalState): { intro: string; steps: string[] } {
  const nodes = rootChildren(state)
  return {
    intro: nodes
      .filter((node) => node.type === 'paragraph')
      .map(nodeText)
      .filter(Boolean)
      .join(' '),
    steps: firstListItems(nodes),
  }
}

/** All top-level text, for finding a quote or checking for content. */
export const stateText = (state: LexicalState): string =>
  rootChildren(state).map(nodeText).join('\n')
