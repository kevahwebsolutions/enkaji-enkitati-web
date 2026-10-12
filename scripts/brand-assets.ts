/**
 * Builds the web logo set in public/brand/ from enkaji-content/brand/logo-source.jpg.
 * Run with: npm run brand:assets
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import ImageTracer from 'imagetracerjs'
import sharp from 'sharp'

const root = process.cwd()
const source = path.join(root, 'enkaji-content', 'brand', 'logo-source.jpg')
const outDir = path.join(root, 'public', 'brand')

const SAND = { r: 247, g: 241, b: 225, alpha: 1 }
const NOISE_FLOOR = 0.045
/** Pixels at least this far from white become fully opaque with their original colour. */
const SOLID_AT = 0.35

type Raw = { data: Buffer; width: number; height: number }

/**
 * Colour-to-alpha against a white background. Faint pixels (JPEG noise) become transparent,
 * soft edges keep their coverage with the white removed so no halo shows on sand or green,
 * and solid logo pixels keep their exact colour.
 */
async function removeWhite(): Promise<Raw> {
  const { data, info } = await sharp(source)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const out = Buffer.alloc(info.width * info.height * 4)

  for (let i = 0, o = 0; i < data.length; i += 3, o += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const coverage = Math.max(255 - r, 255 - g, 255 - b) / 255

    if (coverage < NOISE_FLOOR) {
      out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0
      continue
    }

    const alpha = Math.min(1, coverage / SOLID_AT)
    out[o] = Math.max(0, Math.min(255, Math.round(255 - (255 - r) / alpha)))
    out[o + 1] = Math.max(0, Math.min(255, Math.round(255 - (255 - g) / alpha)))
    out[o + 2] = Math.max(0, Math.min(255, Math.round(255 - (255 - b) / alpha)))
    out[o + 3] = Math.round(alpha * 255)
  }

  return { data: out, width: info.width, height: info.height }
}

type Box = { left: number; top: number; width: number; height: number }

function bounds(img: Raw, yFrom = 0, yTo = img.height): Box {
  let minX = img.width
  let maxX = -1
  let minY = img.height
  let maxY = -1
  for (let y = yFrom; y < yTo; y++) {
    for (let x = 0; x < img.width; x++) {
      if (img.data[(y * img.width + x) * 4 + 3] > 24) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) throw new Error('No visible pixels found in the logo source')
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/** The mark (dome, path, girl and sun) is the first tall band of rows above the wordmark. */
function markRows(img: Raw): [number, number] {
  const filled: boolean[] = []
  for (let y = 0; y < img.height; y++) {
    let any = false
    for (let x = 0; x < img.width && !any; x++) {
      any = img.data[(y * img.width + x) * 4 + 3] > 24
    }
    filled.push(any)
  }
  let start = -1
  for (let y = 0; y <= img.height; y++) {
    if (y < img.height && filled[y]) {
      if (start < 0) start = y
    } else if (start >= 0) {
      if (y - start > 100) return [start, y]
      start = -1
    }
  }
  throw new Error('Could not locate the logo mark')
}

function toSharp(img: Raw, box?: Box) {
  const base = sharp(img.data, { raw: { width: img.width, height: img.height, channels: 4 } })
  return box ? base.extract(box) : base
}

/** Wraps a 32 px PNG in a single-image ICO container. */
function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  header.writeUInt8(size, 6)
  header.writeUInt8(size, 7)
  header.writeUInt8(0, 8)
  header.writeUInt8(0, 9)
  header.writeUInt16LE(1, 10)
  header.writeUInt16LE(32, 12)
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(22, 18)
  return Buffer.concat([header, png])
}

/** Mark centred on a square canvas with padding, optionally on a solid background. */
async function squareIcon(
  mark: Buffer,
  size: number,
  padding: number,
  background: { r: number; g: number; b: number; alpha: number },
): Promise<Buffer> {
  const inner = Math.round(size * (1 - padding * 2))
  const fitted = await sharp(mark)
    .resize(inner, inner, { fit: 'inside', kernel: 'lanczos3' })
    .toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: fitted, gravity: 'centre' }])
    .png()
    .toBuffer()
}

/** Flattens a transparent logo to one colour, keeping its shape (SRS 9.4 one-colour version). */
async function oneColour(
  png: Buffer,
  colour: { r: number; g: number; b: number },
): Promise<Buffer> {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true })
  return sharp({
    create: { width: info.width, height: info.height, channels: 3, background: colour },
  })
    .joinChannel(data, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

type PathSplit = { base: Buffer; path: Buffer; d: string; length: number; size: number }

const GOLD = { r: 196, g: 160, b: 80 }

/**
 * Splits the mark into a base layer and the gold path alone, so the hero can draw the path in with
 * an SVG mask. The path is the largest gold shape that is not the sun. Also returns the path's
 * centreline (found by walking the shape from its lowest pixel) as an SVG path string.
 */
async function splitPath(markSquare: Buffer): Promise<PathSplit> {
  const { data, info } = await sharp(markSquare)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const isGold = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const dist = Math.hypot(
      data[i * 4] - GOLD.r,
      data[i * 4 + 1] - GOLD.g,
      data[i * 4 + 2] - GOLD.b,
    )
    if (data[i * 4 + 3] > 200 && dist < 70) isGold[i] = 1
  }

  const neighbours = (p: number): number[] => {
    const x = p % W
    const y = (p / W) | 0
    const out: number[] = []
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx
        const ny = y + dy
        if ((dx || dy) && nx >= 0 && ny >= 0 && nx < W && ny < H) out.push(ny * W + nx)
      }
    }
    return out
  }

  // The path contains the lowest gold pixel; flood fill from there.
  let seed = -1
  for (let p = W * H - 1; p >= 0 && seed < 0; p--) if (isGold[p]) seed = p
  if (seed < 0) throw new Error('No gold path found in the mark')
  const inPath = new Uint8Array(W * H)
  const order: number[] = [seed]
  const steps = new Int32Array(W * H).fill(-1)
  steps[seed] = 0
  inPath[seed] = 1
  for (let head = 0; head < order.length; head++) {
    for (const q of neighbours(order[head])) {
      if (isGold[q] && steps[q] < 0) {
        steps[q] = steps[order[head]] + 1
        inPath[q] = 1
        order.push(q)
      }
    }
  }

  // Centreline: average position of the pixels at each walking distance.
  const BUCKET = 16
  const sums = new Map<number, { x: number; y: number; n: number }>()
  for (const p of order) {
    const key = Math.floor(steps[p] / BUCKET)
    const cell = sums.get(key) ?? { x: 0, y: 0, n: 0 }
    cell.x += p % W
    cell.y += (p / W) | 0
    cell.n += 1
    sums.set(key, cell)
  }
  const points = [...sums.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, c]) => ({ x: c.x / c.n, y: c.y / c.n }))
  // Run the stroke slightly past both ends so no tip of the shape stays hidden.
  const extend = (from: { x: number; y: number }, to: { x: number; y: number }, by: number) => {
    const len = Math.hypot(to.x - from.x, to.y - from.y) || 1
    return { x: to.x + ((to.x - from.x) / len) * by, y: to.y + ((to.y - from.y) / len) * by }
  }
  points.unshift(extend(points[1], points[0], 24))
  points.push(extend(points[points.length - 2], points[points.length - 1], 24))
  const d = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ')

  // Grow the path mask by two pixels so its anti-aliased edge travels with it.
  const keep = new Uint8Array(W * H)
  const grow = (p: number, depth: number) => {
    keep[p] = 1
    if (depth === 0) return
    for (const q of neighbours(p)) if (!keep[q]) grow(q, depth - 1)
  }
  for (const p of order) grow(p, 2)

  const base = Buffer.from(data)
  const path = Buffer.alloc(data.length)
  for (let p = 0; p < W * H; p++) {
    if (!keep[p]) continue
    for (let c = 0; c < 4; c++) path[p * 4 + c] = data[p * 4 + c]
    base[p * 4 + 3] = 0
  }
  const length = points.reduce(
    (sum, pt, i) =>
      i === 0 ? 0 : sum + Math.hypot(pt.x - points[i - 1].x, pt.y - points[i - 1].y),
    0,
  )
  return { base, path, d, length: Math.ceil(length), size: W }
}

type Layer = { fill: string; d: string }

const BACKGROUND = { r: 247, g: 241, b: 225 }

/**
 * Traces a flat-colour RGBA image into SVG path layers, one per palette colour, composited on the
 * site's sand background (the background layer is dropped). Inline vector paths are not
 * largest-contentful-paint candidates the way an image is, so the hero text stays the LCP.
 */
function traceLayers(
  rgba: Buffer,
  size: number,
  palette: Array<{ r: number; g: number; b: number }>,
): Layer[] {
  const flat = Buffer.from(rgba)
  for (let i = 0; i < flat.length; i += 4) {
    const a = flat[i + 3] / 255
    flat[i] = Math.round(flat[i] * a + BACKGROUND.r * (1 - a))
    flat[i + 1] = Math.round(flat[i + 1] * a + BACKGROUND.g * (1 - a))
    flat[i + 2] = Math.round(flat[i + 2] * a + BACKGROUND.b * (1 - a))
    flat[i + 3] = 255
  }
  const svg = ImageTracer.imagedataToSVG(
    { width: size, height: size, data: new Uint8ClampedArray(flat) },
    {
      pal: [BACKGROUND, ...palette].map((c) => ({ ...c, a: 255 })),
      colorsampling: 0,
      numberofcolors: palette.length + 1,
      mincolorratio: 0,
      colorquantcycles: 1,
      pathomit: 6,
      ltres: 0.5,
      qtres: 0.5,
      roundcoords: 1,
      strokewidth: 0,
      scale: 1,
      viewbox: true,
      desc: false,
      blurradius: 0,
    },
  )
  const byFill = new Map<string, string[]>()
  for (const match of svg.matchAll(/<path fill="rgb\((\d+),(\d+),(\d+)\)"[^>]*? d="([^"]+)"/g)) {
    const [, r, g, b, d] = match
    if (Number(r) === BACKGROUND.r && Number(g) === BACKGROUND.g && Number(b) === BACKGROUND.b)
      continue
    const fill = `#${[r, g, b].map((v) => Number(v).toString(16).padStart(2, '0')).join('')}`
    byFill.set(fill, [...(byFill.get(fill) ?? []), d])
  }
  return [...byFill.entries()].map(([fill, ds]) => ({ fill, d: ds.join(' ') }))
}

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true })
  const clear = { r: 0, g: 0, b: 0, alpha: 0 }

  const keyed = await removeWhite()
  const fullBox = bounds(keyed)
  const fullPng = await toSharp(keyed, fullBox).png().toBuffer()

  const [rowStart, rowEnd] = markRows(keyed)
  const markBox = bounds(keyed, rowStart, rowEnd)
  const markPng = await toSharp(keyed, markBox).png().toBuffer()

  const outputs: Array<[string, Buffer]> = []

  outputs.push([
    'logo-full.png',
    await sharp(fullPng)
      .resize({ width: 1200, kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  ])
  outputs.push([
    'logo-full@2x.webp',
    await sharp(fullPng)
      .resize({ width: 2400, kernel: 'lanczos3' })
      .webp({ quality: 90, alphaQuality: 100 })
      .toBuffer(),
  ])
  const markSquare = await squareIcon(markPng, 512, 0.05, clear)
  outputs.push(['logo-mark.png', markSquare])
  outputs.push(['logo-mark-cream.png', await oneColour(markSquare, SAND)])
  const split = await splitPath(markSquare)
  const green = { r: 28, g: 56, b: 14 }
  const gold = { r: 196, g: 160, b: 80 }
  const cream = { r: 236, g: 218, b: 168 }
  const baseLayers = traceLayers(split.base, split.size, [cream, gold, green])
  const pathLayers = traceLayers(split.path, split.size, [gold])
  await writeFile(
    path.join(root, 'src', 'components', 'sections', 'hero-mark.generated.ts'),
    `// Generated by scripts/brand-assets.ts: the logo mark traced to vector paths (512 px square).
` +
      `// heroMarkPathD is the centreline of the gold path, used to draw it in with an SVG mask.
` +
      `export const heroMarkBase = ${JSON.stringify(baseLayers)}
` +
      `export const heroMarkPath = ${JSON.stringify(pathLayers)}
` +
      `export const heroMarkPathD = '${split.d}'
` +
      `export const heroMarkPathLength = ${split.length}
`,
  )

  const favicon = await squareIcon(markPng, 32, 0.04, clear)
  outputs.push(['favicon.ico', pngToIco(favicon, 32)])
  outputs.push(['icon-192.png', await squareIcon(markPng, 192, 0.14, SAND)])
  outputs.push(['icon-512.png', await squareIcon(markPng, 512, 0.14, SAND)])
  outputs.push(['apple-touch-icon.png', await squareIcon(markPng, 180, 0.14, SAND)])

  const ogLogo = await sharp(fullPng)
    .resize({ height: 470, fit: 'inside', kernel: 'lanczos3' })
    .toBuffer()
  outputs.push([
    'og-default.png',
    await sharp({ create: { width: 1200, height: 630, channels: 4, background: SAND } })
      .composite([{ input: ogLogo, gravity: 'centre' }])
      .png({ compressionLevel: 9 })
      .toBuffer(),
  ])

  for (const [name, buffer] of outputs) {
    await writeFile(path.join(outDir, name), buffer)
    console.log(`public/brand/${name}  ${(buffer.length / 1024).toFixed(1)} KB`)
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
