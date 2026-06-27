/**
 * Block-aware read queries (PRD §19 block enforcement): every read filters
 * out blocked pairs (either direction) and non-active users/profiles.
 * Server-only — called from server components / route handlers.
 */
import { auth } from '@clerk/nextjs/server'
import { and, asc, eq, ne, notInArray, or, sql } from 'drizzle-orm'
import { requireUser } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { sunCompatibility, type Compatibility } from '@/lib/horoscope'

/** Default theme id (matches `:root` in globals.css — no `[data-theme]` block). */
export const DEFAULT_THEME_ID = 'soft-pixel-romance'

/** User ids hidden from `me` (blocked either direction). */
async function blockedIdsFor(meId: string): Promise<string[]> {
  const rows = await db()
    .select({
      blocker: schema.blocks.blockerUserId,
      blocked: schema.blocks.blockedUserId,
    })
    .from(schema.blocks)
    .where(
      or(eq(schema.blocks.blockerUserId, meId), eq(schema.blocks.blockedUserId, meId)),
    )
  return rows.map((r) => (r.blocker === meId ? r.blocked : r.blocker))
}

export type BuddySummary = {
  userId: string
  username: string
  displayName: string
  mood: string | null
  theme: string
  reelThumb: string | null
  intent: string | null
  city: string | null
  state: string | null
  distanceMiles: number | null
}

export type BrowseListOptions = {
  maxDistanceMiles?: number
}

/** Haversine distance in miles (viewer at lat0/lng0, row at lat/lng). */
function haversineMilesSql(
  lat0: number,
  lng0: number,
  latCol: typeof schema.profiles.latitude,
  lngCol: typeof schema.profiles.longitude,
) {
  return sql<number>`(
    3959 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(${lat0})) * cos(radians(${latCol}))
        * cos(radians(${lngCol}) - radians(${lng0}))
        + sin(radians(${lat0})) * sin(radians(${latCol}))
      ))
    )
  )`
}

/** Browse buddy list: active users/profiles, blocked pairs excluded, me excluded. */
export async function getBrowseList(opts?: BrowseListOptions): Promise<BuddySummary[]> {
  const me = await requireUser()
  const hidden = await blockedIdsFor(me.id)
  const dbc = db()

  const [myProfile] = await dbc
    .select({
      latitude: schema.profiles.latitude,
      longitude: schema.profiles.longitude,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, me.id))
    .limit(1)

  const myLat = myProfile?.latitude
  const myLng = myProfile?.longitude
  const useDistance =
    opts?.maxDistanceMiles != null &&
    myLat != null &&
    myLng != null &&
    Number.isFinite(opts.maxDistanceMiles)

  const distanceExpr =
    useDistance && myLat != null && myLng != null
      ? haversineMilesSql(myLat, myLng, schema.profiles.latitude, schema.profiles.longitude)
      : sql<number | null>`null`

  const baseWhere = and(
    eq(schema.profiles.status, 'active'),
    eq(schema.users.status, 'active'),
    ne(schema.users.id, me.id),
    ...(hidden.length > 0 ? [notInArray(schema.users.id, hidden)] : []),
    ...(useDistance
      ? [
          sql`${schema.profiles.latitude} IS NOT NULL`,
          sql`${schema.profiles.longitude} IS NOT NULL`,
          sql`${distanceExpr} <= ${opts!.maxDistanceMiles!}`,
        ]
      : []),
  )

  const rows = await dbc
    .select({
      userId: schema.users.id,
      username: schema.profiles.username,
      displayName: schema.users.displayName,
      mood: schema.profiles.moodStatus,
      theme: schema.profiles.profileTheme,
      intent: schema.profiles.datingIntent,
      city: schema.profiles.city,
      state: schema.profiles.state,
      distanceMiles: distanceExpr,
    })
    .from(schema.profiles)
    .innerJoin(schema.users, eq(schema.profiles.userId, schema.users.id))
    .where(baseWhere)
    .orderBy(
      useDistance ? sql`${distanceExpr} asc` : asc(schema.profiles.username),
    )
    .limit(50)

  // First frame of each user's active reel as the thumbnail.
  const result: BuddySummary[] = []
  for (const row of rows) {
    const [thumb] = await dbc
      .select({ url: schema.mediaItems.mediaUrl })
      .from(schema.memoryReels)
      .innerJoin(schema.reelFrames, eq(schema.reelFrames.reelId, schema.memoryReels.id))
      .innerJoin(schema.mediaItems, eq(schema.reelFrames.mediaItemId, schema.mediaItems.id))
      .where(and(eq(schema.memoryReels.userId, row.userId), eq(schema.memoryReels.isActive, true)))
      .orderBy(asc(schema.reelFrames.position))
      .limit(1)
    result.push({
      ...row,
      reelThumb: thumb?.url ?? null,
      intent: row.intent,
      distanceMiles:
        row.distanceMiles != null ? Math.round(Number(row.distanceMiles) * 10) / 10 : null,
    })
  }
  return result
}

export type VibePageData = {
  userId: string
  username: string
  displayName: string
  bio: string | null
  mood: string | null
  theme: string
  intent: string
  avatar: string | null
  softLaunch: boolean
  city: string | null
  state: string | null
  sunSign: string | null
  moonSign: string | null
  risingSign: string | null
  showHoroscope: boolean
  /** Sun-sign compatibility with the viewer — set only when viewing someone
   *  else who shows their horoscope and both have a sun sign. */
  horoscopeMatch: Compatibility | null
  isOwner: boolean
  interests: string[]
  prompts: { question: string; answer: string }[]
  reel: {
    beat: { title: string; audioUrl: string } | null
    frames: { id: string; src: string; caption: string | null; durationMs: number }[]
  } | null
}

/** Full Vibe Page by username — null if missing, blocked, or not active. */
export async function getVibePage(username: string): Promise<VibePageData | null> {
  const me = await requireUser()
  const dbc = db()

  const [row] = await dbc
    .select({
      profileId: schema.profiles.id,
      userId: schema.users.id,
      username: schema.profiles.username,
      displayName: schema.users.displayName,
      bio: schema.profiles.bio,
      mood: schema.profiles.moodStatus,
      theme: schema.profiles.profileTheme,
      intent: schema.profiles.datingIntent,
      avatar: schema.profiles.avatarUrl,
      softLaunch: schema.profiles.softLaunchModeEnabled,
      city: schema.profiles.city,
      state: schema.profiles.state,
      sunSign: schema.profiles.sunSign,
      moonSign: schema.profiles.moonSign,
      risingSign: schema.profiles.risingSign,
      showHoroscope: schema.profiles.showHoroscope,
    })
    .from(schema.profiles)
    .innerJoin(schema.users, eq(schema.profiles.userId, schema.users.id))
    .where(
      and(
        eq(schema.profiles.username, username),
        eq(schema.profiles.status, 'active'),
        eq(schema.users.status, 'active'),
      ),
    )
    .limit(1)
  if (!row) return null

  if (row.userId !== me.id) {
    const hidden = await blockedIdsFor(me.id)
    if (hidden.includes(row.userId)) return null
  }

  const interests = await dbc
    .select({ name: schema.interests.name })
    .from(schema.profileInterests)
    .innerJoin(schema.interests, eq(schema.profileInterests.interestId, schema.interests.id))
    .where(eq(schema.profileInterests.profileId, row.profileId))
    .orderBy(asc(schema.profileInterests.position))

  const prompts = await dbc
    .select({ question: schema.prompts.promptText, answer: schema.profilePromptAnswers.answer })
    .from(schema.profilePromptAnswers)
    .innerJoin(schema.prompts, eq(schema.profilePromptAnswers.promptId, schema.prompts.id))
    .where(eq(schema.profilePromptAnswers.profileId, row.profileId))

  const [reelRow] = await dbc
    .select({ id: schema.memoryReels.id, beatId: schema.memoryReels.beatId })
    .from(schema.memoryReels)
    .where(and(eq(schema.memoryReels.userId, row.userId), eq(schema.memoryReels.isActive, true)))
    .limit(1)

  let reel: VibePageData['reel'] = null
  if (reelRow) {
    const frames = await dbc
      .select({
        id: schema.reelFrames.id,
        src: schema.mediaItems.mediaUrl,
        caption: schema.reelFrames.caption,
        durationMs: schema.reelFrames.durationMs,
      })
      .from(schema.reelFrames)
      .innerJoin(schema.mediaItems, eq(schema.reelFrames.mediaItemId, schema.mediaItems.id))
      .where(eq(schema.reelFrames.reelId, reelRow.id))
      .orderBy(asc(schema.reelFrames.position))

    let beat: { title: string; audioUrl: string } | null = null
    if (reelRow.beatId) {
      const [b] = await dbc
        .select({ title: schema.beats.title, audioUrl: schema.beats.audioUrl })
        .from(schema.beats)
        .where(eq(schema.beats.id, reelRow.beatId))
        .limit(1)
      beat = b ?? null
    }
    reel = { beat, frames }
  }

  // Sun-sign compatibility with the viewer (only on someone else's shown horoscope).
  let horoscopeMatch: Compatibility | null = null
  if (row.userId !== me.id && row.showHoroscope && row.sunSign) {
    const [mine] = await dbc
      .select({ sunSign: schema.profiles.sunSign })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, me.id))
      .limit(1)
    if (mine?.sunSign) horoscopeMatch = sunCompatibility(mine.sunSign, row.sunSign)
  }

  const { profileId: _omit, ...pub } = row
  return {
    ...pub,
    horoscopeMatch,
    isOwner: row.userId === me.id,
    interests: interests.map((i) => i.name),
    prompts,
    reel,
  }
}

export type ChemistryData = {
  matchId: string
  starters: { id: string; text: string; context: string | null }[]
  you: { username: string; displayName: string; mood: string | null; theme: string; reelThumb: string | null }
  them: { username: string; displayName: string; mood: string | null; theme: string; reelThumb: string | null }
}

/** Match page data — only visible to the two members of an active match. */
export async function getChemistry(matchId: string): Promise<ChemistryData | null> {
  const me = await requireUser()
  const dbc = db()

  const [match] = await dbc
    .select()
    .from(schema.matches)
    .where(and(eq(schema.matches.id, matchId), eq(schema.matches.status, 'active')))
    .limit(1)
  if (!match) return null
  if (match.userAId !== me.id && match.userBId !== me.id) return null

  const otherId = match.userAId === me.id ? match.userBId : match.userAId

  const card = async (userId: string) => {
    const [r] = await dbc
      .select({
        username: schema.profiles.username,
        displayName: schema.users.displayName,
        mood: schema.profiles.moodStatus,
        theme: schema.profiles.profileTheme,
      })
      .from(schema.profiles)
      .innerJoin(schema.users, eq(schema.profiles.userId, schema.users.id))
      .where(eq(schema.profiles.userId, userId))
      .limit(1)
    if (!r) return null
    const [thumb] = await dbc
      .select({ url: schema.mediaItems.mediaUrl })
      .from(schema.memoryReels)
      .innerJoin(schema.reelFrames, eq(schema.reelFrames.reelId, schema.memoryReels.id))
      .innerJoin(schema.mediaItems, eq(schema.reelFrames.mediaItemId, schema.mediaItems.id))
      .where(and(eq(schema.memoryReels.userId, userId), eq(schema.memoryReels.isActive, true)))
      .orderBy(asc(schema.reelFrames.position))
      .limit(1)
    return { ...r, reelThumb: thumb?.url ?? null }
  }

  const [you, them] = await Promise.all([card(me.id), card(otherId)])
  if (!you || !them) return null

  const starters = await dbc
    .select({
      id: schema.conversationStarters.id,
      text: schema.conversationStarters.starterText,
      context: schema.conversationStarters.sourceContext,
    })
    .from(schema.conversationStarters)
    .where(eq(schema.conversationStarters.matchId, matchId))
    .limit(3)

  return { matchId, starters, you, them }
}

/** The 4 provided Profile Beats (seeded). */
export async function getBeats() {
  return db()
    .select({
      id: schema.beats.id,
      title: schema.beats.title,
      vibe: schema.beats.vibe,
      audioUrl: schema.beats.audioUrl,
    })
    .from(schema.beats)
    .orderBy(asc(schema.beats.title))
}

/** My profile row, or null if onboarding hasn't been completed. */
export async function getMyProfile() {
  const me = await requireUser()
  const [profile] = await db()
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, me.id))
    .limit(1)
  return profile ? { ...profile, displayName: me.displayName } : null
}

/** Whether the signed-in user has a coarse location set (for browse distance filter). */
export async function viewerHasLocation(): Promise<boolean> {
  const me = await requireUser()
  const [row] = await db()
    .select({
      latitude: schema.profiles.latitude,
      longitude: schema.profiles.longitude,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, me.id))
    .limit(1)
  return row?.latitude != null && row?.longitude != null
}

/**
 * The signed-in user's UI theme id (hyphenated, e.g. `late-night-aim`), or the
 * default when signed out / no profile yet. Intentionally lightweight and
 * never throws — safe to call from the root layout on every request (it skips
 * the lazy-provisioning path in `requireUser`).
 */
export async function getMyThemeId(): Promise<string> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return DEFAULT_THEME_ID
    const [row] = await db()
      .select({ theme: schema.profiles.profileTheme })
      .from(schema.profiles)
      .innerJoin(schema.users, eq(schema.profiles.userId, schema.users.id))
      .where(
        and(
          eq(schema.users.authProviderId, clerkId),
          eq(schema.users.status, 'active'),
        ),
      )
      .limit(1)
    return row?.theme ? row.theme.replace(/_/g, '-') : DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}
