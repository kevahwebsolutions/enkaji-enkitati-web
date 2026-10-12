/**
 * Acceptance check for SRS 10.4 / NFR-PRV-02: no personal phone number, national ID number or KRA
 * PIN in the built pages or in the repository's source and content. Run after `npm run build`.
 *
 * The CBO's own public number (+254 721 500197) is the only phone number allowed.
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const PUBLIC_PHONE_DIGITS = '254721500197'

const patterns: Array<{ name: string; regex: RegExp }> = [
  { name: 'phone (+254)', regex: /\+?254[\s-]?\d{3}[\s-]?\d{6}/g },
  { name: 'phone (07xx / 01xx)', regex: /\b0[17]\d{2}[\s-]?\d{6}\b/g },
  { name: 'KRA PIN', regex: /\b[AP]\d{9}[A-Z]\b/g },
  { name: 'ID-like 8-digit number', regex: /(?<![\w.#/=-])\d{8}(?![\w.-])/g },
]

const BUILT = ['.next/server/app']
const SOURCE = ['src', 'enkaji-content', 'docs']
const BUILT_EXT = /\.(html|rsc|txt|meta)$/
const SOURCE_EXT = /\.(ts|tsx|md|json|css)$/
const SKIP = new Set(['node_modules', '.next', '.git', 'migrations', 'payload-types.ts'])

async function walk(dir: string, ext: RegExp, found: string[] = []): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return found
  }
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, ext, found)
    else if (ext.test(entry.name)) found.push(full)
  }
  return found
}

async function main(): Promise<void> {
  const files = [
    ...(await Promise.all(BUILT.map((dir) => walk(dir, BUILT_EXT)))).flat(),
    ...(await Promise.all(SOURCE.map((dir) => walk(dir, SOURCE_EXT)))).flat(),
  ]
  let hits = 0

  for (const file of files) {
    const text = await readFile(file, 'utf8')
    for (const { name, regex } of patterns) {
      for (const match of text.matchAll(regex)) {
        const digits = match[0].replace(/\D/g, '')
        if (digits.endsWith(PUBLIC_PHONE_DIGITS)) continue
        // Seed fixtures and docs name no real numbers, so any other match is reported.
        hits++
        const around = text
          .slice(Math.max(0, (match.index ?? 0) - 30), (match.index ?? 0) + 40)
          .replace(/\s+/g, ' ')
        console.log(`${name}: "${match[0]}" in ${file.replace(/\\/g, '/')} ...${around}...`)
      }
    }
  }

  console.log(`Scanned ${files.length} files. Suspicious matches: ${hits}`)
  process.exit(hits === 0 ? 0 : 1)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
