/**
 * Seed script (PRD §12 note: demo profiles are P0 in practice).
 * Run: npm run db:seed   (after db:push and DATABASE_URL are set)
 *
 * Idempotent — uses onConflictDoNothing / lookups so re-runs are safe.
 */
import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db, schema } from '../lib/db'

const BEATS = [
  { title: 'lo-fi tape loop', vibe: 'warm & nostalgic', audioUrl: '/audio/lofi-tape.wav' },
  { title: 'dial-up dream', vibe: 'glitchy & soft', audioUrl: '/audio/dialup-dream.wav' },
  { title: 'arcade sunset', vibe: 'bright & playful', audioUrl: '/audio/arcade-sunset.wav' },
  { title: 'midnight modem', vibe: 'late & mellow', audioUrl: '/audio/midnight-modem.wav' },
]

const INTERESTS = [
  'lo-fi beats', 'pixel art', 'retro gaming', 'vinyl records', 'film photography',
  'indie games', 'anime', 'thrifting', 'journaling', 'synthwave', 'cozy games',
  'sci-fi novels', 'baking', 'rollerblading', 'mixtapes', 'collage', 'plants',
  'tarot', 'road trips', 'arcades', 'webcore', 'midi keyboards', 'sticker swaps',
  'late-night drives', 'noodle shops', 'old forums', 'zines', 'speedrunning',
]

const PROMPTS = [
  'A perfect Sunday is...',
  "I'll instantly vibe with you if...",
  'The most nostalgic sound I know is...',
  'My comfort rewatch is...',
  "Something I made that I'm quietly proud of...",
]

// Demo users mirror the prototype's buddy list (prototype/mm/data.js)
const DEMO_USERS = [
  { username: 'mixtape_kid', displayName: 'Robin', mood: 'rewinding a good tape', intent: 'slow_burn', theme: 'soft_pixel_romance', bio: "I make playlists for feelings that don't have names yet.", interests: ['mixtapes', 'film photography', 'lo-fi beats', 'vinyl records', 'thrifting', 'journaling', 'road trips', 'plants'], reel: [{ url: '/reels/sunset-drive.png', caption: 'golden hour drives' }, { url: '/reels/polaroid-pile.png', caption: 'my polaroid pile' }, { url: '/reels/bedroom-setup.png', caption: 'where the magic happens' }] },
  { username: 'pixelpetal', displayName: 'Mira', mood: 'drawing tiny worlds', intent: 'slow_burn', theme: 'soft_pixel_romance', bio: 'tiny worlds, big feelings.', interests: ['pixel art', 'lo-fi beats', 'thrifting', 'cozy games'], reel: [{ url: '/reels/bedroom-setup.png', caption: 'studio corner' }] },
  { username: 'arcadeghost', displayName: 'Dev', mood: 'chasing a high score', intent: 'friend_first', theme: 'arcade_crush', bio: 'one more credit.', interests: ['retro gaming', 'arcades', 'speedrunning', 'synthwave'], reel: [{ url: '/reels/arcade-night.png', caption: 'friday night cabinet' }] },
  { username: 'noodlebowl', displayName: 'Kai', mood: 'rainy day ramen', intent: 'just_browsing', theme: 'cyber_cafe', bio: 'soup-first worldview.', interests: ['noodle shops', 'journaling', 'plants', 'baking'], reel: [{ url: '/reels/cafe-window.png', caption: 'window seat, always' }] },
  { username: 'zinequeen', displayName: 'Sam', mood: 'cutting and pasting', intent: 'slow_burn', theme: 'soft_pixel_romance', bio: 'analog collage, digital heart.', interests: ['zines', 'collage', 'thrifting', 'film photography'], reel: [{ url: '/reels/skate-park.png', caption: 'shooting the locals' }] },
  { username: 'glittercd', displayName: 'Bex', mood: 'shiny and new', intent: 'open_to_dating', theme: 'dreamcast_summer', bio: 'burning CDs and bridges (kidding).', interests: ['vinyl records', 'mixtapes', 'webcore', 'sticker swaps'], reel: [{ url: '/reels/cafe-window.png', caption: 'latte art critic' }] },
  { username: 'cassettesun', displayName: 'Ari', mood: 'sunny and unbothered', intent: 'co_op_mode', theme: 'dreamcast_summer', bio: 'player two energy.', interests: ['road trips', 'late-night drives', 'indie games', 'cozy games'], reel: [{ url: '/reels/sunset-drive.png', caption: 'golden hour, always' }] },
  { username: 'softmodem', displayName: 'Lou', mood: 'late night online', intent: 'friend_first', theme: 'late_night_aim', bio: 'away message connoisseur.', interests: ['old forums', 'webcore', 'midi keyboards', 'sci-fi novels'], reel: [{ url: '/reels/polaroid-pile.png', caption: 'the archive' }] },
]

async function main() {
  const dbc = db()

  console.log('Seeding beats…')
  await dbc.insert(schema.beats).values(BEATS).onConflictDoNothing()

  console.log('Seeding interests…')
  await dbc
    .insert(schema.interests)
    .values(INTERESTS.map((name) => ({ name, category: 'general' })))
    .onConflictDoNothing()

  console.log('Seeding prompts…')
  for (const promptText of PROMPTS) {
    const existing = await dbc
      .select({ id: schema.prompts.id })
      .from(schema.prompts)
      .where(eq(schema.prompts.promptText, promptText))
      .limit(1)
    if (existing.length === 0) {
      await dbc.insert(schema.prompts).values({ promptText, category: 'personality' })
    }
  }

  console.log('Seeding demo users + profiles + reels…')
  const allInterests = await dbc.select().from(schema.interests)
  const interestId = new Map(allInterests.map((i) => [i.name, i.id]))
  const [firstBeat] = await dbc.select().from(schema.beats).limit(1)

  for (const demo of DEMO_USERS) {
    const [user] = await dbc
      .insert(schema.users)
      .values({
        authProviderId: `seed_${demo.username}`,
        email: `${demo.username}@demo.memorymatch.app`,
        displayName: demo.displayName,
        dateOfBirth: '1999-06-15',
      })
      .onConflictDoNothing()
      .returning()
    if (!user) {
      console.log(`  ${demo.username} already seeded, skipping`)
      continue
    }

    const [profile] = await dbc
      .insert(schema.profiles)
      .values({
        userId: user.id,
        username: demo.username,
        bio: demo.bio,
        datingIntent: demo.intent,
        moodStatus: demo.mood,
        profileTheme: demo.theme,
      })
      .returning()

    await dbc.insert(schema.profileInterests).values(
      demo.interests
        .map((name, i) => ({ profileId: profile.id, interestId: interestId.get(name)!, position: i + 1 }))
        .filter((r) => r.interestId),
    )

    const [reel] = await dbc
      .insert(schema.memoryReels)
      .values({ userId: user.id, beatId: firstBeat?.id, isActive: true })
      .returning()

    for (const [i, frame] of demo.reel.entries()) {
      const [media] = await dbc
        .insert(schema.mediaItems)
        .values({ userId: user.id, mediaUrl: frame.url, mediaType: 'image' })
        .returning()
      await dbc.insert(schema.reelFrames).values({
        reelId: reel.id,
        mediaItemId: media.id,
        position: i + 1,
        caption: frame.caption,
        durationMs: 4000,
      })
    }
    console.log(`  seeded ${demo.username}`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
