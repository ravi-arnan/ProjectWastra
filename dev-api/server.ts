/**
 * Dev-only Express server that proxies Vercel serverless functions locally.
 * Run via: tsx watch dev-api/server.ts
 * Vite dev server proxies /api/* → http://localhost:3001
 */
import 'dotenv/config'
import express from 'express'
import type { Request, Response } from 'express'
import { pathToFileURL } from 'url'
import path from 'path'

const app = express()
app.use(express.json())

const API_DIR = path.resolve(process.cwd(), 'api')

// Generic handler: forward any /api/:name request to the matching api/*.ts file
app.all('/api/:name', async (req: Request, res: Response) => {
  const handlerPath = path.join(API_DIR, `${req.params.name}.ts`)

  try {
    // Cache-bust on every request in watch mode
    const url = pathToFileURL(handlerPath).href + `?t=${Date.now()}`
    const mod = await import(url)
    const handler = mod.default

    if (typeof handler !== 'function') {
      return res.status(500).json({ error: `No default export found in api/${req.params.name}.ts` })
    }

    // Express res is compatible with VercelResponse for status().json() chaining
    await handler(req, res)
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
      return res.status(404).json({ error: `API route /api/${req.params.name} not found` })
    }
    console.error(`[dev-api] Error in /api/${req.params.name}:`, err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`\n🚀 Dev API server running → http://localhost:${PORT}`)
  console.log(`   Handles: /api/* → ./api/*.ts\n`)
})
