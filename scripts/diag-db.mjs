// Temporary DB connection diagnostic (debug session a24592).
import fs from 'node:fs'
import path from 'node:path'
import postgres from 'postgres'

const LOG = path.join(process.cwd(), 'debug-a24592.log')
function log(hypothesisId, message, data) {
  const line = JSON.stringify({
    sessionId: 'a24592',
    runId: 'diag',
    hypothesisId,
    location: 'scripts/diag-db.mjs',
    message,
    data,
    timestamp: Date.now(),
  })
  fs.appendFileSync(LOG, line + '\n')
  console.log(message, data)
}

// Load .env.local manually (no dotenv dependency assumed).
const envPath = path.join(process.cwd(), '.env.local')
const raw = fs.readFileSync(envPath, 'utf8')
let urlFromFile = null
for (const lineStr of raw.split(/\r?\n/)) {
  const m = lineStr.match(/^DATABASE_URL=(.*)$/)
  if (m) urlFromFile = m[1]
}

const urlFromEnv = process.env.DATABASE_URL ?? null
log('D', 'env-source-check', {
  hasShellEnv: urlFromEnv != null,
  shellEqualsFile: urlFromEnv === urlFromFile,
})

const url = urlFromEnv ?? urlFromFile
let parsed
try {
  parsed = new URL(url)
  log('B', 'url-parse', {
    protocol: parsed.protocol,
    username: parsed.username,
    decodedPasswordLength: decodeURIComponent(parsed.password).length,
    rawPasswordLength: parsed.password.length,
    host: parsed.host,
    pathname: parsed.pathname,
    search: parsed.search,
  })
} catch (e) {
  log('B', 'url-parse-failed', { error: String(e) })
}

async function tryConnect(label, hypId, opts, overrideUrl) {
  const client = postgres(overrideUrl ?? url, { max: 1, prepare: false, ...opts })
  try {
    const r = await client`select current_user as who, 1 as ok`
    log(hypId, `connect-success:${label}`, { who: r[0]?.who })
  } catch (e) {
    log(hypId, `connect-failed:${label}`, {
      code: e?.code,
      message: e?.message?.slice(0, 200),
    })
  } finally {
    await client.end({ timeout: 5 }).catch(() => {})
  }
}

// Mirror lib/db/index.ts behavior: ssl 'require'.
await tryConnect('app-config (ssl require)', 'A', { ssl: 'require' })

// Test C: strip the sslmode query param to see if it changes parsing/auth.
if (parsed) {
  const noQuery = `${parsed.protocol}//${parsed.username}:${parsed.password}@${parsed.host}${parsed.pathname}`
  await tryConnect('no-query-string (ssl require)', 'C', { ssl: 'require' }, noQuery)
}

// Test B alt: pass discrete options with manually-decoded password.
if (parsed) {
  await tryConnect('discrete-decoded-password', 'B', {
    ssl: 'require',
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  }, undefined)
}

process.exit(0)
