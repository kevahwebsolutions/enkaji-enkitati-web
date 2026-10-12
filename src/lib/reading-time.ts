import { stateText, type LexicalState } from '@/lib/lexical'

const WORDS_PER_MINUTE = 200

/** Whole minutes to read the text, never less than one. */
export function readingMinutes(state: LexicalState | null | undefined): number {
  if (!state) return 1
  const words = stateText(state).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}
