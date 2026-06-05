/**
 * Media optimization for public/ assets.
 *
 * Landing photos ship as 5K–8K originals (1–2 MB each) but are displayed in
 * slots no wider than ~800px. This downscales them to a sane max edge and emits
 * a WebP sibling for each, so the app can serve <picture> with a JPG fallback.
 *
 * Originals are recoverable from git history. Run: `node scripts/optimize-media.mjs`
 */
import { readdir, stat, writeFile } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import sharp from 'sharp'

const PUBLIC_DIR = new URL('../public/', import.meta.url).pathname
const MAX_EDGE = 1600 // long-edge cap — covers full-width hero use at 2x on most screens
const JPG_QUALITY = 78
const WEBP_QUALITY = 72

const RASTER = new Set(['.jpg', '.jpeg', '.png'])

function kb(bytes) {
  return Math.round(bytes / 1024)
}

async function run() {
  const entries = await readdir(PUBLIC_DIR)
  const targets = entries.filter((f) => RASTER.has(extname(f).toLowerCase()))

  let beforeTotal = 0
  let afterTotal = 0

  for (const file of targets) {
    const path = join(PUBLIC_DIR, file)
    const before = (await stat(path)).size
    beforeTotal += before

    const meta = await sharp(path, { failOn: 'none' }).metadata()
    const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0)
    const oversized = longEdge > MAX_EDGE
    const resizeOpts = oversized ? { width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true } : undefined

    // Encode both outputs from the SAME original pipeline (not from the
    // re-encoded JPG) so the WebP is a first-generation transcode. The two
    // encodes are independent, so run them in parallel.
    const pipeline = sharp(path, { failOn: 'none' }).rotate().resize(resizeOpts)
    const [jpgBuf, webpBuf] = await Promise.all([
      pipeline.clone().jpeg({ quality: JPG_QUALITY, mozjpeg: true }).toBuffer(),
      pipeline.clone().webp({ quality: WEBP_QUALITY }).toBuffer(),
    ])

    // Only adopt a re-encode when it actually beats the source — already-optimized
    // small images must not be inflated by a needless re-encode.
    let jpgFinal = before
    if (jpgBuf.length < before) {
      await writeFile(path, jpgBuf)
      jpgFinal = jpgBuf.length
    }

    // WebP sibling — keep only if smaller than the final JPG (it usually is for
    // photos, but not for tiny already-compressed images).
    const webpPath = join(PUBLIC_DIR, `${basename(file, extname(file))}.webp`)
    let webpNote = 'skipped'
    let webpFinal = 0
    if (webpBuf.length < jpgFinal) {
      await writeFile(webpPath, webpBuf)
      webpFinal = webpBuf.length
      webpNote = `${kb(webpBuf.length)}KB`
    }

    afterTotal += jpgFinal + webpFinal
    const action = oversized ? `${longEdge}px→${MAX_EDGE}px` : 'kept-size'
    console.log(`${file.padEnd(40)} ${action.padStart(12)}  ${kb(before)}KB -> jpg ${kb(jpgFinal)}KB + webp ${webpNote}`)
  }

  console.log('—'.repeat(60))
  console.log(`total raster: ${kb(beforeTotal)}KB -> ${kb(afterTotal)}KB (jpg + webp where smaller)`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
