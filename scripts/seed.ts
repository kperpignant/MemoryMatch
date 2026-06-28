/**
 * Seed script (PRD §12 note: demo profiles are P0 in practice).
 * Run: npm run db:seed   (after db:push and DATABASE_URL are set)
 *
 * Re-runnable: users/beats/interests/prompts use lookups + onConflict, and
 * demo profiles are UPSERTED (with interests, prompt answers refreshed) so
 * re-seeding refines the existing cast instead of skipping it. Reels are only
 * created when a user doesn't have one yet (avoids duplicate frames).
 *
 * Profile pictures + bespoke reel imagery land in a later commit (image upload
 * is blocked on another ticket); for now reels reuse the sample /reels art so
 * the cast still feels alive.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { and, eq } from 'drizzle-orm'
import { db, schema } from '../lib/db'

const BEATS = [
  { title: 'lo-fi tape loop', vibe: 'warm & nostalgic', audioUrl: '/audio/lofi-tape.wav' },
  { title: 'dial-up dream', vibe: 'glitchy & soft', audioUrl: '/audio/dialup-dream.wav' },
  { title: 'arcade sunset', vibe: 'bright & playful', audioUrl: '/audio/arcade-sunset.wav' },
  { title: 'midnight modem', vibe: 'late & mellow', audioUrl: '/audio/midnight-modem.wav' },
]

const INTERESTS = [
  // music + media
  'lo-fi beats', 'vinyl records', 'mixtapes', 'synthwave', 'midi keyboards', 'karaoke',
  'anime', 'k-dramas', 'sci-fi novels', 'poetry', 'used bookstores', 'crosswords',
  // games
  'retro gaming', 'indie games', 'cozy games', 'arcades', 'speedrunning', 'board games', 'valorant',
  // art + making
  'pixel art', 'film photography', 'polaroids', 'collage', 'zines', 'pottery', 'knitting',
  'cross-stitch', 'woodworking', 'vintage fashion', 'sticker swaps',
  // outdoors + body
  'bouldering', 'trail running', 'hiking', 'birding', 'disc golf', 'rollerblading', 'tide pooling',
  // home + cozy
  'plants', 'herbalism', 'bread baking', 'baking', 'cooking', 'farmers markets', 'cats',
  // food + drink
  'noodle shops', 'cold brew', 'matcha', 'thrifting',
  // mind + spirit
  'journaling', 'tarot', 'astrology', 'salsa dancing', 'raves',
  // internet + roads
  'webcore', 'old forums', 'late-night drives', 'road trips', 'marine biology', 'dad jokes',
]

const PROMPTS = [
  'A perfect Sunday is...',
  "I'll instantly vibe with you if...",
  'The most nostalgic sound I know is...',
  'My comfort rewatch is...',
  "Something I made that I'm quietly proud of...",
]

type DemoUser = {
  username: string
  displayName: string
  dob: string
  mood: string
  intent: string
  theme: string
  bio: string
  city: string
  state: string
  lat: number
  lng: number
  sun: string
  moon: string
  rising: string
  showHoroscope: boolean
  interests: string[]
  prompts: { q: string; a: string }[]
  reel: { url: string; caption: string }[]
}

// The cast. New England-ish locations at varying distances from Boston so the
// browse radius filter has something to chew on; the people themselves span a
// range of ages, backgrounds, intents, themes, and personalities.
const DEMO_USERS: DemoUser[] = [
  {
    username: 'mixtape_kid', displayName: 'Robin', dob: '1998-08-04',
    mood: 'rewinding a good tape', intent: 'slow_burn', theme: 'soft_pixel_romance',
    bio: "I make playlists for feelings that don't have names yet. Will absolutely make you a mix before a second date.",
    city: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589,
    sun: 'leo', moon: 'pisces', rising: 'libra', showHoroscope: true,
    interests: ['mixtapes', 'vinyl records', 'film photography', 'lo-fi beats', 'thrifting', 'journaling', 'road trips', 'plants'],
    prompts: [
      { q: 'The most nostalgic sound I know is...', a: 'a cassette deck clicking shut, then that little wow of the motor catching.' },
      { q: "I'll instantly vibe with you if...", a: 'you have strong feelings about track ordering on an album.' },
    ],
    reel: [{ url: '/reels/sunset-drive.png', caption: 'golden hour drives' }, { url: '/reels/polaroid-pile.png', caption: 'my polaroid pile' }, { url: '/reels/bedroom-setup.png', caption: 'where the magic happens' }],
  },
  {
    username: 'pixelpetal', displayName: 'Mira', dob: '1999-07-01',
    mood: 'drawing tiny worlds', intent: 'slow_burn', theme: 'soft_pixel_romance',
    bio: 'tiny worlds, big feelings. I draw little rooms I wish I could live in and name every houseplant I own.',
    city: 'Cambridge', state: 'MA', lat: 42.3736, lng: -71.1097,
    sun: 'cancer', moon: 'taurus', rising: 'virgo', showHoroscope: true,
    interests: ['pixel art', 'cozy games', 'plants', 'lo-fi beats', 'thrifting', 'matcha', 'knitting', 'film photography'],
    prompts: [
      { q: 'A perfect Sunday is...', a: 'slow coffee, a quiet game, and finishing one tiny drawing by sundown.' },
      { q: "Something I made that I'm quietly proud of...", a: 'a 32x32 pixel diner that took me a week of evenings. it has a working jukebox.' },
    ],
    reel: [{ url: '/reels/bedroom-setup.png', caption: 'studio corner' }, { url: '/reels/cafe-window.png', caption: 'sketching spot' }],
  },
  {
    username: 'arcadeghost', displayName: 'Dev', dob: '2000-04-02',
    mood: 'chasing a high score', intent: 'friend_first', theme: 'arcade_crush',
    bio: 'one more credit, i swear. competitive at skee-ball, gentle everywhere else. will lose to you at mario kart on purpose. once.',
    city: 'Somerville', state: 'MA', lat: 42.3876, lng: -71.0995,
    sun: 'aries', moon: 'gemini', rising: 'leo', showHoroscope: true,
    interests: ['retro gaming', 'arcades', 'speedrunning', 'synthwave', 'board games', 'disc golf', 'karaoke', 'indie games'],
    prompts: [
      { q: "I'll instantly vibe with you if...", a: 'you can explain your main and mean it.' },
      { q: 'A perfect Sunday is...', a: 'a roll of quarters, a dim arcade, and tacos after.' },
    ],
    reel: [{ url: '/reels/arcade-night.png', caption: 'friday night cabinet' }, { url: '/reels/skate-park.png', caption: 'cooldown laps' }],
  },
  {
    username: 'noodlebowl', displayName: 'Kai', dob: '1997-05-10',
    mood: 'rainy day ramen', intent: 'just_browsing', theme: 'cyber_cafe',
    bio: 'soup-first worldview. i keep a running spreadsheet of every bowl in the city. introvert who warms up fast over good broth.',
    city: 'Brookline', state: 'MA', lat: 42.3318, lng: -71.1212,
    sun: 'taurus', moon: 'cancer', rising: 'pisces', showHoroscope: false,
    interests: ['noodle shops', 'cooking', 'journaling', 'plants', 'cold brew', 'used bookstores', 'cats', 'baking'],
    prompts: [
      { q: 'A perfect Sunday is...', a: 'farmers market in the morning, a long simmer in the afternoon, no plans after.' },
      { q: "Something I made that I'm quietly proud of...", a: 'a 14-hour tonkotsu that finally tasted like the place I miss.' },
    ],
    reel: [{ url: '/reels/cafe-window.png', caption: 'window seat, always' }],
  },
  {
    username: 'zinequeen', displayName: 'Sam', dob: '1996-11-08',
    mood: 'cutting and pasting', intent: 'slow_burn', theme: 'soft_pixel_romance',
    bio: 'analog collage, digital heart. i run a tiny zine about people i meet on the train. opinions on glue sticks, ask me.',
    city: 'Quincy', state: 'MA', lat: 42.2529, lng: -71.0023,
    sun: 'scorpio', moon: 'aquarius', rising: 'capricorn', showHoroscope: true,
    interests: ['zines', 'collage', 'film photography', 'thrifting', 'poetry', 'vintage fashion', 'used bookstores', 'cross-stitch'],
    prompts: [
      { q: "Something I made that I'm quietly proud of...", a: 'issue #7 — it was all strangers’ handwriting and it made two of them become friends.' },
      { q: "I'll instantly vibe with you if...", a: 'you still print things out and write in the margins.' },
    ],
    reel: [{ url: '/reels/skate-park.png', caption: 'shooting the locals' }, { url: '/reels/polaroid-pile.png', caption: 'cutting room floor' }],
  },
  {
    username: 'glittercd', displayName: 'Bex', dob: '2001-06-09',
    mood: 'shiny and new', intent: 'open_to_dating', theme: 'dreamcast_summer',
    bio: 'burning CDs and bridges (kidding). loud laugh, more-is-more closet, will hype you up like it’s my job. it kind of is.',
    city: 'Waltham', state: 'MA', lat: 42.3765, lng: -71.2356,
    sun: 'gemini', moon: 'leo', rising: 'sagittarius', showHoroscope: true,
    interests: ['vinyl records', 'mixtapes', 'webcore', 'sticker swaps', 'karaoke', 'vintage fashion', 'raves', 'salsa dancing'],
    prompts: [
      { q: 'A perfect Sunday is...', a: 'thrift haul, iced everything, and an unhinged karaoke night to close it out.' },
      { q: "I'll instantly vibe with you if...", a: 'you send the unhinged voice memo instead of typing it.' },
    ],
    reel: [{ url: '/reels/cafe-window.png', caption: 'latte art critic' }, { url: '/reels/arcade-night.png', caption: 'neon era' }],
  },
  {
    username: 'cassettesun', displayName: 'Ari', dob: '1999-12-02',
    mood: 'sunny and unbothered', intent: 'co_op_mode', theme: 'dreamcast_summer',
    bio: 'player two energy. i drive nowhere in particular with the windows down and call it research. snacks are non-negotiable.',
    city: 'Salem', state: 'MA', lat: 42.5195, lng: -70.8967,
    sun: 'sagittarius', moon: 'aries', rising: 'aquarius', showHoroscope: true,
    interests: ['road trips', 'late-night drives', 'indie games', 'cozy games', 'disc golf', 'hiking', 'synthwave', 'farmers markets'],
    prompts: [
      { q: 'A perfect Sunday is...', a: 'no alarm, a full tank, and a coast road we’ve never taken.' },
      { q: 'The most nostalgic sound I know is...', a: 'a Dreamcast booting up. instant summer.' },
    ],
    reel: [{ url: '/reels/sunset-drive.png', caption: 'golden hour, always' }, { url: '/reels/skate-park.png', caption: 'pit stop' }],
  },
  {
    username: 'softmodem', displayName: 'Lou', dob: '1995-02-07',
    mood: 'late night online', intent: 'friend_first', theme: 'late_night_aim',
    bio: 'away message connoisseur. i build little websites no one asked for and keep a folder of perfect 2am songs. night owl, soft heart.',
    city: 'Worcester', state: 'MA', lat: 42.2626, lng: -71.8023,
    sun: 'aquarius', moon: 'scorpio', rising: 'cancer', showHoroscope: true,
    interests: ['old forums', 'webcore', 'midi keyboards', 'sci-fi novels', 'lo-fi beats', 'crosswords', 'poetry', 'cats'],
    prompts: [
      { q: 'The most nostalgic sound I know is...', a: 'a 56k handshake. genuinely gets me a little emotional.' },
      { q: "Something I made that I'm quietly proud of...", a: 'a guestbook page for my friends that’s still getting signed 4 years later.' },
    ],
    reel: [{ url: '/reels/polaroid-pile.png', caption: 'the archive' }, { url: '/reels/bedroom-setup.png', caption: 'the night shift' }],
  },

  // ---- new cast ----
  {
    username: 'ferncottage', displayName: 'Wren', dob: '1998-09-09',
    mood: 'proofing dough, reading tarot', intent: 'slow_burn', theme: 'soft_pixel_romance',
    bio: 'soft-spoken plant person who bakes when anxious, so there is always bread. i dry flowers and overthink, gently.',
    city: 'Northampton', state: 'MA', lat: 42.3251, lng: -72.6412,
    sun: 'virgo', moon: 'taurus', rising: 'pisces', showHoroscope: true,
    interests: ['herbalism', 'bread baking', 'plants', 'journaling', 'used bookstores', 'tarot', 'knitting', 'farmers markets'],
    prompts: [
      { q: 'A perfect Sunday is...', a: 'a loaf in the oven, rain on the window, and a stack of library holds.' },
      { q: "I'll instantly vibe with you if...", a: 'you let me read your cards even if you don’t believe in it.' },
    ],
    reel: [{ url: '/reels/cafe-window.png', caption: 'rainy proofing day' }, { url: '/reels/bedroom-setup.png', caption: 'the drying rack' }],
  },
  {
    username: 'dperez_dj', displayName: 'Dani', dob: '1997-08-15',
    mood: 'crate-digging for the set', intent: 'open_to_dating', theme: 'arcade_crush',
    bio: 'i DJ salsa & freestyle nights and yes i will teach you the basic step. big extrovert, bigger record bag. abuela taught me to cook.',
    city: 'Lowell', state: 'MA', lat: 42.6334, lng: -71.3162,
    sun: 'leo', moon: 'sagittarius', rising: 'gemini', showHoroscope: true,
    interests: ['vinyl records', 'salsa dancing', 'cooking', 'karaoke', 'mixtapes', 'farmers markets', 'raves', 'film photography'],
    prompts: [
      { q: "I'll instantly vibe with you if...", a: 'you stay till the lights come up and help carry crates.' },
      { q: 'A perfect Sunday is...', a: 'cooking for ten people who only ate for two, then dancing in the kitchen.' },
    ],
    reel: [{ url: '/reels/arcade-night.png', caption: 'booth view' }, { url: '/reels/sunset-drive.png', caption: 'load-out' }],
  },
  {
    username: 'quietstorm', displayName: 'Malik', dob: '1996-11-19',
    mood: 'first light, last thought',  intent: 'slow_burn', theme: 'late_night_aim',
    bio: 'i run before the city wakes up and write the rest of the day. drawn to long conversations and short poems. ask me what i’m reading.',
    city: 'Providence', state: 'RI', lat: 41.8240, lng: -71.4128,
    sun: 'scorpio', moon: 'pisces', rising: 'virgo', showHoroscope: true,
    interests: ['poetry', 'trail running', 'used bookstores', 'journaling', 'sci-fi novels', 'cold brew', 'crosswords', 'lo-fi beats'],
    prompts: [
      { q: 'The most nostalgic sound I know is...', a: 'my dad’s record needle dropping on a Sunday morning.' },
      { q: "Something I made that I'm quietly proud of...", a: 'a chapbook i printed 50 copies of. 49 left, but the one matters.' },
    ],
    reel: [{ url: '/reels/skate-park.png', caption: 'dawn miles' }, { url: '/reels/polaroid-pile.png', caption: 'notebook pile' }],
  },
  {
    username: 'boba_baddie', displayName: 'Thuy', dob: '1999-01-05',
    mood: 'one more episode (lying)', intent: 'just_browsing', theme: 'cyber_cafe',
    bio: 'professionally tired, recreationally sarcastic. ranked in valorant, ranked higher in finding the best bo bia. i will judge your boba order lovingly.',
    city: 'Boston', state: 'MA', lat: 42.3530, lng: -71.1310,
    sun: 'capricorn', moon: 'gemini', rising: 'scorpio', showHoroscope: true,
    interests: ['k-dramas', 'valorant', 'noodle shops', 'matcha', 'cold brew', 'indie games', 'cats', 'thrifting'],
    prompts: [
      { q: "I'll instantly vibe with you if...", a: 'you also pause the show to look up where they got the jacket.' },
      { q: 'My comfort rewatch is...', a: 'the same three episodes of a cooking competition on loop. don’t perceive me.' },
    ],
    reel: [{ url: '/reels/cafe-window.png', caption: 'study-with-me' }, { url: '/reels/arcade-night.png', caption: 'ranked grind' }],
  },
  {
    username: 'trailmixx', displayName: 'Sofia', dob: '2000-03-30',
    mood: 'chalk on my hands', intent: 'friend_first', theme: 'dreamcast_summer',
    bio: 'climber and bird nerd, sunshine personified. i will drag you up a small mountain and reward you with the best gas-station snacks. life list: 212.',
    city: 'Burlington', state: 'VT', lat: 44.4759, lng: -73.2121,
    sun: 'aries', moon: 'leo', rising: 'sagittarius', showHoroscope: true,
    interests: ['bouldering', 'birding', 'hiking', 'trail running', 'disc golf', 'road trips', 'farmers markets', 'cooking'],
    prompts: [
      { q: 'A perfect Sunday is...', a: 'an alpine start, a hard problem sent, and pancakes the size of my face.' },
      { q: "I'll instantly vibe with you if...", a: 'you get excited about a bird you’ve seen a hundred times.' },
    ],
    reel: [{ url: '/reels/sunset-drive.png', caption: 'trailhead at dawn' }, { url: '/reels/skate-park.png', caption: 'send it' }],
  },
  {
    username: 'grandpacore', displayName: 'Theo', dob: '1987-05-02',
    mood: 'sanding something, again', intent: 'open_to_dating', theme: 'soft_pixel_romance',
    bio: 'older, wholesome, and unbothered. i restore furniture nobody wanted and tell jokes nobody asked for. cardigan enthusiast. great with a casserole.',
    city: 'Portland', state: 'ME', lat: 43.6591, lng: -70.2568,
    sun: 'taurus', moon: 'capricorn', rising: 'libra', showHoroscope: true,
    interests: ['woodworking', 'vintage fashion', 'cooking', 'used bookstores', 'farmers markets', 'crosswords', 'dad jokes', 'cats'],
    prompts: [
      { q: "Something I made that I'm quietly proud of...", a: 'a dining table from a barn beam. it’ll outlive me, which is the point.' },
      { q: 'A perfect Sunday is...', a: 'estate sales at dawn, a slow braise, the crossword in pen (mostly).' },
    ],
    reel: [{ url: '/reels/bedroom-setup.png', caption: 'the workshop' }, { url: '/reels/cafe-window.png', caption: 'sunday paper' }],
  },
  {
    username: 'neon_oracle', displayName: 'Priya', dob: '1998-03-05',
    mood: 'mercury is doing something',  intent: 'social_discovery', theme: 'late_night_aim',
    bio: 'astrology is my love language and the dancefloor is my temple. i’ll pull a card for you at 2am. pisces sun, so yes i did already cry today.',
    city: 'Cambridge', state: 'MA', lat: 42.3736, lng: -71.1097,
    sun: 'pisces', moon: 'aquarius', rising: 'leo', showHoroscope: true,
    interests: ['astrology', 'tarot', 'raves', 'salsa dancing', 'vinyl records', 'poetry', 'matcha', 'film photography'],
    prompts: [
      { q: "I'll instantly vibe with you if...", a: 'you know your big three before your coffee order.' },
      { q: 'The most nostalgic sound I know is...', a: 'the first synth swell of a song dropping at a warehouse party.' },
    ],
    reel: [{ url: '/reels/arcade-night.png', caption: 'warehouse glow' }, { url: '/reels/polaroid-pile.png', caption: 'card of the day' }],
  },
  {
    username: 'saltmarsh', displayName: 'Jojo', dob: '1997-10-06',
    mood: 'low tide, clear head', intent: 'friend_first', theme: 'cyber_cafe',
    bio: 'marine bio grad who talks to crabs (professionally). dry humor, salt in my hair. astrology skeptic but i’ll hear you out over chowder.',
    city: 'New Bedford', state: 'MA', lat: 41.6362, lng: -70.9342,
    sun: 'libra', moon: 'virgo', rising: 'taurus', showHoroscope: false,
    interests: ['tide pooling', 'marine biology', 'birding', 'hiking', 'cooking', 'board games', 'used bookstores', 'cold brew'],
    prompts: [
      { q: "Something I made that I'm quietly proud of...", a: 'a tide-pool field guide for the local kids’ camp, fully hand-drawn.' },
      { q: 'A perfect Sunday is...', a: 'a 5am low tide, a thermos of coffee, and absolutely no one around.' },
    ],
    reel: [{ url: '/reels/skate-park.png', caption: 'low tide finds' }, { url: '/reels/sunset-drive.png', caption: 'the long way home' }],
  },
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
  const allPrompts = await dbc.select().from(schema.prompts)
  const promptId = new Map(allPrompts.map((p) => [p.promptText, p.id]))
  const [firstBeat] = await dbc.select().from(schema.beats).limit(1)

  // Warn loudly if a user references an interest we never seeded.
  for (const demo of DEMO_USERS) {
    for (const name of demo.interests) {
      if (!interestId.has(name)) console.warn(`  ⚠ ${demo.username}: unknown interest "${name}"`)
    }
  }

  for (const demo of DEMO_USERS) {
    // Upsert the user (idempotent on the seed auth id), then make sure name/dob
    // reflect the latest seed data.
    const authProviderId = `seed_${demo.username}`
    const [inserted] = await dbc
      .insert(schema.users)
      .values({
        authProviderId,
        email: `${demo.username}@demo.memorymatch.app`,
        displayName: demo.displayName,
        dateOfBirth: demo.dob,
      })
      .onConflictDoNothing()
      .returning()

    let user = inserted
    if (!user) {
      const [existing] = await dbc
        .select()
        .from(schema.users)
        .where(eq(schema.users.authProviderId, authProviderId))
        .limit(1)
      if (!existing) {
        console.warn(`  ⚠ could not resolve ${demo.username}, skipping`)
        continue
      }
      await dbc
        .update(schema.users)
        .set({ displayName: demo.displayName, dateOfBirth: demo.dob, updatedAt: new Date() })
        .where(eq(schema.users.id, existing.id))
      user = existing
    }

    // Upsert the profile so re-runs refine existing demo users.
    const profileValues = {
      username: demo.username,
      bio: demo.bio,
      datingIntent: demo.intent,
      moodStatus: demo.mood,
      profileTheme: demo.theme,
      city: demo.city,
      state: demo.state,
      latitude: demo.lat,
      longitude: demo.lng,
      sunSign: demo.sun,
      moonSign: demo.moon,
      risingSign: demo.rising,
      showHoroscope: demo.showHoroscope,
      updatedAt: new Date(),
    }
    const [profile] = await dbc
      .insert(schema.profiles)
      .values({ userId: user.id, ...profileValues })
      .onConflictDoUpdate({ target: schema.profiles.userId, set: profileValues })
      .returning()

    // Refresh interests (Top 8, ordered).
    await dbc.delete(schema.profileInterests).where(eq(schema.profileInterests.profileId, profile.id))
    await dbc.insert(schema.profileInterests).values(
      demo.interests
        .map((name, i) => ({ profileId: profile.id, interestId: interestId.get(name)!, position: i + 1 }))
        .filter((r) => r.interestId),
    )

    // Refresh prompt answers.
    await dbc
      .delete(schema.profilePromptAnswers)
      .where(eq(schema.profilePromptAnswers.profileId, profile.id))
    const answers = demo.prompts
      .map((p) => ({ profileId: profile.id, promptId: promptId.get(p.q)!, answer: p.a }))
      .filter((r) => r.promptId)
    if (answers.length > 0) await dbc.insert(schema.profilePromptAnswers).values(answers)

    // Reels reuse sample art for now; only create one if the user has none yet.
    const [existingReel] = await dbc
      .select({ id: schema.memoryReels.id })
      .from(schema.memoryReels)
      .where(and(eq(schema.memoryReels.userId, user.id), eq(schema.memoryReels.isActive, true)))
      .limit(1)
    if (!existingReel) {
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
    }
    console.log(`  ✓ ${demo.username} (${demo.displayName})`)
  }

  console.log(`Done — ${DEMO_USERS.length} demo users seeded/refreshed.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
