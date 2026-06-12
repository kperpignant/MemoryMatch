/**
 * Database client — Aurora PostgreSQL via RDS Proxy (PRD §20).
 *
 * - postgres.js with a small per-function pool (RDS Proxy does the real pooling)
 * - SSL required in production paths; DATABASE_URL comes from env
 *   (Vercel env var locally / in preview; AWS Secrets Manager feeds the
 *   production credential — see docs/MemoryMatch-PRD.md §20)
 * - Lazily initialized so builds and key-less local runs don't open a socket
 */
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let _db: PostgresJsDatabase<typeof schema> | null = null

export function db(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local (see .env.example) before using the database.',
    )
  }
  const client = postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 3),
    ssl: process.env.DATABASE_SSL === 'disable' ? undefined : 'require',
    prepare: false, // RDS Proxy pins sessions on prepared statements
  })
  _db = drizzle(client, { schema })
  return _db
}

export { schema }
