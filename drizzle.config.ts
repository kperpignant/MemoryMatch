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
    // Aurora requires SSL. drizzle-kit (incl. studio) uses its own driver that
    // ignores the string 'require', so pass the object form it honors. Aurora's
    // CA isn't in the default trust store, so don't verify the chain here.
    ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false },
  },
  strict: true,
  verbose: true,
})
