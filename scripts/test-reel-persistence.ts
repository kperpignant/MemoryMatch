/**
 * Integration test for the P0 reel-persistence fix.
 *
 * Drives the real save/read code paths (saveReelForUser / getReelForUser)
 * against the configured database: save a reel, read it back, then EDIT it
 * (swap a photo, change a duration, reorder, change beat snippet), read again,
 * and assert every change persisted. Uses a throwaway user, cleaned up at the end.
 *
 * Run: npx tsx scripts/test-reel-persistence.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { eq } from 'drizzle-orm'
import { db, schema } from '../lib/db'
import { saveReelForUser } from '../lib/actions/reels'
import { getReelForUser } from '../lib/queries'

let failures = 0
function check(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ✓ ${label}`)
  } else {
    failures++
    console.error(`  ✗ ${label}`, detail !== undefined ? JSON.stringify(detail) : '')
  }
}

async function main() {
  const dbc = db()

  // Use a real beat so beatId round-trips through the FK.
  const [beat] = await dbc.select().from(schema.beats).limit(1)
  if (!beat) throw new Error('No beats seeded — run npm run db:seed first')

  // Throwaway user (cascades clean up reel/frames/media on delete).
  const [user] = await dbc
    .insert(schema.users)
    .values({
      authProviderId: `test_reel_${Date.now()}`,
      email: `test_reel_${Date.now()}@test.local`,
      displayName: 'Reel Tester',
      dateOfBirth: '1999-01-01',
    })
    .returning()
  console.log(`\nCreated test user ${user.id}`)

  try {
    // ---- 1) Initial save -------------------------------------------------
    console.log('\n[1] Save a 3-frame reel')
    await saveReelForUser(user.id, {
      beatId: beat.id,
      beatStartSec: 30,
      frames: [
        { mediaUrl: '/reels/sunset-drive.png', caption: 'frame A', durationMs: 4000 },
        { mediaUrl: '/reels/arcade-night.png', caption: 'frame B', durationMs: 2000 },
        { mediaUrl: '/reels/cafe-window.png', caption: 'frame C', durationMs: 6000 },
      ],
    })

    let reel = await getReelForUser(user.id)
    check('reel reads back', !!reel, reel)
    check('frame count = 3', reel?.frames.length === 3, reel?.frames.length)
    check('beat persisted', reel?.beatId === beat.id)
    check('beat snippet start = 30', reel?.beatStartSec === 30, reel?.beatStartSec)
    check('order preserved (A,B,C)', reel?.frames.map((f) => f.caption).join(',') === 'frame A,frame B,frame C', reel?.frames.map((f) => f.caption))
    check('per-frame durations (4,2,6)', reel?.frames.map((f) => f.duration).join(',') === '4,2,6', reel?.frames.map((f) => f.duration))
    check('photos persisted', reel?.frames[0].src === '/reels/sunset-drive.png', reel?.frames[0].src)

    // ---- 2) Edit: swap a photo, change a duration, reorder, move snippet --
    console.log('\n[2] Edit — swap frame A photo, change its duration, reverse order, snippet→0')
    await saveReelForUser(user.id, {
      beatId: beat.id,
      beatStartSec: 0,
      frames: [
        { mediaUrl: '/reels/cafe-window.png', caption: 'frame C', durationMs: 6000 },
        { mediaUrl: '/reels/arcade-night.png', caption: 'frame B', durationMs: 2000 },
        { mediaUrl: '/reels/skate-park.png', caption: 'frame A', durationMs: 1000 }, // swapped photo + duration
      ],
    })

    reel = await getReelForUser(user.id)
    check('still 3 frames after edit', reel?.frames.length === 3, reel?.frames.length)
    check('reorder persisted (C,B,A)', reel?.frames.map((f) => f.caption).join(',') === 'frame C,frame B,frame A', reel?.frames.map((f) => f.caption))
    check('swapped photo persisted', reel?.frames[2].src === '/reels/skate-park.png', reel?.frames[2].src)
    check('changed duration persisted (1s)', reel?.frames[2].duration === 1, reel?.frames[2].duration)
    check('snippet start updated to 0', reel?.beatStartSec === 0, reel?.beatStartSec)

    // ---- 3) No orphaned media rows --------------------------------------
    const media = await dbc
      .select({ id: schema.mediaItems.id })
      .from(schema.mediaItems)
      .where(eq(schema.mediaItems.userId, user.id))
    check('old media cleaned up (exactly 3 remain)', media.length === 3, media.length)
  } finally {
    await dbc.delete(schema.users).where(eq(schema.users.id, user.id))
    console.log('\nCleaned up test user.')
  }

  console.log(failures === 0 ? '\n✅ ALL CHECKS PASSED' : `\n❌ ${failures} CHECK(S) FAILED`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
