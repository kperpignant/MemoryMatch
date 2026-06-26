/**
 * Baseline Drizzle migration journal when the database was created via `db:push`
 * (or otherwise already matches migration SQL). Inserts hashes for all migrations
 * in drizzle/meta/_journal.json without re-running SQL.
 *
 * Run once: npm run db:baseline
 */
import { config } from 'dotenv'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import postgres from 'postgres'

config({ path: '.env.local' })

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set in .env.local')

  const migrations = readMigrationFiles({ migrationsFolder: './drizzle' })
  const sql = postgres(url, {
    ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false },
    max: 1,
  })

  try {
    await sql`CREATE SCHEMA IF NOT EXISTS drizzle`
    await sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `

    const existing = await sql`SELECT hash FROM drizzle.__drizzle_migrations`
    const existingHashes = new Set(existing.map((r) => r.hash))

    let inserted = 0
    for (const m of migrations) {
      if (existingHashes.has(m.hash)) continue
      await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${m.hash}, ${m.folderMillis})
      `
      inserted++
    }

    const total = (await sql`SELECT count(*)::int AS c FROM drizzle.__drizzle_migrations`)[0].c
    console.log(`Baseline complete: ${inserted} migration(s) recorded, ${total} total in journal.`)
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
