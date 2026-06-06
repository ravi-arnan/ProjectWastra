// Regenerate the self-hosted Material Symbols icon subset.
//
// Why this exists: the app self-hosts a tiny subset of Material Symbols
// (public/fonts/material-symbols-subset.woff2) instead of the ~1.1MB Google
// font. Whenever a new icon name is used in the code, the subset must be
// regenerated or that icon renders as literal text (e.g. "COMPARE_ARROWS").
//
// What it does:
//   1. Scans src/ for every icon name referenced as a string literal.
//   2. Intersects them with the official Material Symbols name list so junk
//      tokens are dropped.
//   3. Asks the Google Fonts API for a subset containing exactly those icons,
//      with opsz/wght/GRAD pinned and only the FILL axis kept variable (so the
//      `.filled` modifier still works) — that keeps the file ~25KB.
//   4. Downloads the woff2 and writes it to public/fonts/.
//
// Run: node scripts/generate-icon-subset.mjs
//
// Requires network access (raw.githubusercontent.com + fonts.googleapis.com).

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const SRC_DIR = join(ROOT, 'src')
const OUT = join(ROOT, 'public', 'fonts', 'material-symbols-subset.woff2')
const CODEPOINTS_URL =
  'https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints'
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) files.push(...walk(full))
    else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(full))) files.push(full)
  }
  return files
}

// Collect every quoted snake_case token in the source tree. Icon names are
// always passed as plain string literals (<Icon name="x" />, icon: 'x',
// inline ternaries, and icon-map object values), so this captures all of them.
function collectTokens() {
  const tokens = new Set()
  const re = /['"]([a-z][a-z0-9_]+)['"]/g
  for (const file of walk(SRC_DIR)) {
    const text = readFileSync(file, 'utf8')
    let m
    while ((m = re.exec(text))) tokens.add(m[1])
  }
  return tokens
}

async function officialNames() {
  const res = await fetch(CODEPOINTS_URL)
  if (!res.ok) throw new Error(`codepoints fetch failed: ${res.status}`)
  const text = await res.text()
  return new Set(text.split('\n').map((l) => l.split(' ')[0]).filter(Boolean))
}

async function fetchSubset(names) {
  const family =
    'Material Symbols Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0'
  const url =
    'https://fonts.googleapis.com/css2?' +
    new URLSearchParams({ family, display: 'block' }).toString() +
    '&icon_names=' +
    names.join(',')
  const cssRes = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!cssRes.ok) throw new Error(`css fetch failed: ${cssRes.status}`)
  const css = await cssRes.text()
  const fontUrl = css.match(/url\((https:\/\/[^)]+)\)/)?.[1]
  if (!fontUrl) throw new Error('no font url in CSS:\n' + css)
  const fontRes = await fetch(fontUrl, { headers: { 'User-Agent': UA } })
  if (!fontRes.ok) throw new Error(`font fetch failed: ${fontRes.status}`)
  return Buffer.from(await fontRes.arrayBuffer())
}

const used = collectTokens()
const valid = await officialNames()
const icons = [...used].filter((t) => valid.has(t)).sort()
console.log(`Found ${icons.length} icons in src/`)

const woff2 = await fetchSubset(icons)
writeFileSync(OUT, woff2)
console.log(`Wrote ${OUT} (${woff2.length} bytes) covering ${icons.length} icons.`)
