import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(process.cwd(), 'enkaji-content', 'content')

export type FrontMatter = Record<string, string | number | number[]>

export type Section = { heading: string; body: string }

export async function readContent(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), 'utf8')
}

export async function readJson<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readContent(relativePath)) as T
}

function parseScalar(raw: string): string | number | number[] {
  const value = raw.trim()
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((n) => Number.isFinite(n))
  }
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  return value
}

/** Splits a markdown file into its simple `key: value` front matter and the body. */
export function parseFrontMatter(source: string): { data: FrontMatter; body: string } {
  const text = source.replace(/\r\n/g, '\n')
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text)
  if (!match) return { data: {}, body: text.trim() }
  const data: FrontMatter = {}
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    data[line.slice(0, colon).trim()] = parseScalar(line.slice(colon + 1))
  }
  return { data, body: match[2].trim() }
}

/** Splits a markdown body on its `## ` headings. Text before the first heading is dropped. */
export function splitSections(body: string): Section[] {
  const sections: Section[] = []
  let current: Section | null = null
  for (const line of body.replace(/\r\n/g, '\n').split('\n')) {
    const heading = /^##\s+(.+)$/.exec(line)
    if (heading) {
      if (current) sections.push(current)
      current = { heading: heading[1].trim(), body: '' }
    } else if (current) {
      current.body += `${line}\n`
    }
  }
  if (current) sections.push(current)
  return sections.map((section) => ({ ...section, body: section.body.trim() }))
}

export function sectionBody(sections: Section[], heading: string): string {
  const found = sections.find((section) => section.heading.toLowerCase().startsWith(heading))
  if (!found) throw new Error(`Section "${heading}" not found`)
  return found.body
}

/** Lines that start with "- " become list items. */
export function bullets(markdown: string): string[] {
  return markdown
    .split('\n')
    .map((line) => /^\s*-\s+(.+)$/.exec(line)?.[1].trim())
    .filter((item): item is string => Boolean(item))
}

/** Lines that start with "1. " become list items. */
export function numbered(markdown: string): string[] {
  return markdown
    .split('\n')
    .map((line) => /^\s*\d+\.\s+(.+)$/.exec(line)?.[1].trim())
    .filter((item): item is string => Boolean(item))
}

/** Rows of a pipe table, without the header and divider rows. */
export function tableRows(markdown: string): string[][] {
  return markdown
    .split('\n')
    .filter((line) => line.trim().startsWith('|'))
    .map((line) =>
      line
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((cell) => cell.trim()),
    )
    .filter((cells) => !cells.every((cell) => /^-+$/.test(cell)))
    .slice(1)
}
