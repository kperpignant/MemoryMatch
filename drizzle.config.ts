import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Next.js uses .env.local; load it here so drizzle-kit sees DATABASE_URL too.
config({ path: '.env.local' })

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
    // Aurora requires SSL; drizzle-kit makes its own connection so set it here too.
    ssl: process.env.DATABASE_SSL === 'disable' ? false : 'require',
  },
  strict: true,
  verbose: true,
})
