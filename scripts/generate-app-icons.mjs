/**
 * Generate the @capacitor/assets source set from the Wastra logo.
 *
 * Produces assets/ inputs (icon foreground/background, square icon, light/dark
 * splash) that `npx @capacitor/assets generate --android` expands into every
 * Android mipmap density + adaptive icon + splash.
 *
 * Run: node scripts/generate-app-icons.mjs
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// Resolve paths relative to the repo root (this file lives in scripts/), so the
// script works regardless of the current working directory.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOGO = resolve(ROOT, 'src/assets/wastra_logo.png')
const OUT = resolve(ROOT, 'assets')

// Brand surfaces (match capacitor.config.ts / PWA manifest).
const LIGHT = '#fff8f5'
const DARK = '#0b2330'

const r = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, alpha: 1 }
}

/** Composite the logo, scaled to `logoSize`, centered on a `size` canvas. */
async function compose(size, logoSize, background) {
  const logo = await sharp(LOGO).resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer()
}

await mkdir(OUT, { recursive: true })

const transparent = { r: 0, g: 0, b: 0, alpha: 0 }

// Adaptive icon foreground: logo at 620/1024 (~61%) sits inside Android's 66%
// safe zone, so the anydpi adaptive-icon XML references it full-bleed (no extra
// inset). Background is a flat brand surface, also full-bleed.
await sharp(await compose(1024, 620, transparent)).toFile(`${OUT}/icon-foreground.png`)
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: r(LIGHT) } }).png().toFile(`${OUT}/icon-background.png`)

// Legacy / store square icon: a little more bleed on the brand surface.
await sharp(await compose(1024, 800, r(LIGHT))).toFile(`${OUT}/icon-only.png`)

// Splash screens (light + dark).
await sharp(await compose(2732, 900, r(LIGHT))).toFile(`${OUT}/splash.png`)
await sharp(await compose(2732, 900, r(DARK))).toFile(`${OUT}/splash-dark.png`)

console.log('Generated assets/: icon-foreground, icon-background, icon-only, splash, splash-dark')
