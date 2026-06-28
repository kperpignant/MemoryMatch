/**
 * Block-aware read queries (PRD §19 block enforcement): every read filters
 * out blocked pairs (either direction) and non-active users/profiles.
 * Server-only — called from server components / route handlers.
 */
import { auth } from '@clerk/nextjs/server'
import { and, asc, desc, eq, gt, inArray, isNull, ne, notInArray, or, sql } from 'drizzle-orm'
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
  avatarUrl: string | null
  mood: string | null
  theme: string
  reelThumb: string | null
  reelThumbFrameId: string | null
  interests: string[]
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
      avatarUrl: schema.profiles.avatarUrl,
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

  // First frame of each user's active reel as the thumbnail + their Top 8 interests.
  const result: BuddySummary[] = []
  for (const row of rows) {
    const [thumb] = await dbc
      .select({ id: schema.reelFrames.id, url: schema.mediaItems.mediaUrl })
      .from(schema.memoryReels)
      .innerJoin(schema.reelFrames, eq(schema.reelFrames.reelId, schema.memoryReels.id))
      .innerJoin(schema.mediaItems, eq(schema.reelFrames.mediaItemId, schema.mediaItems.id))
      .where(and(eq(schema.memoryReels.userId, row.userId), eq(schema.memoryReels.isActive, true)))
      .orderBy(asc(schema.reelFrames.position))
      .limit(1)

    const interestRows = await dbc
      .select({ name: schema.interests.name })
      .from(schema.profileInterests)
      .innerJoin(schema.profiles, eq(schema.profileInterests.profileId, schema.profiles.id))
      .innerJoin(schema.interests, eq(schema.profileInterests.interestId, schema.interests.id))
      .where(eq(schema.profiles.userId, row.userId))
      .orderBy(asc(schema.profileInterests.position))

    result.push({
      ...row,
      reelThumb: thumb?.url ?? null,
      reelThumbFrameId: thumb?.id ?? null,
      interests: interestRows.map((i) => i.name),
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
  viewerHasLiked: boolean
  viewerHasCharmed: boolean
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
  // Whether the viewer has already liked / charmed this person (so the UI can
  // reflect persisted state on revisit instead of always rendering "un-liked").
  let viewerHasLiked = false
  let viewerHasCharmed = false
  if (row.userId !== me.id) {
    const [likeRow] = await dbc
      .select({ id: schema.likes.id })
      .from(schema.likes)
      .where(and(eq(schema.likes.likerUserId, me.id), eq(schema.likes.likedUserId, row.userId)))
      .limit(1)
    viewerHasLiked = Boolean(likeRow)

    const [charmRow] = await dbc
      .select({ id: schema.reelReactions.id })
      .from(schema.reelReactions)
      .innerJoin(schema.reelFrames, eq(schema.reelReactions.reelFrameId, schema.reelFrames.id))
      .innerJoin(schema.memoryReels, eq(schema.reelFrames.reelId, schema.memoryReels.id))
      .where(and(eq(schema.reelReactions.reactorUserId, me.id), eq(schema.memoryReels.userId, row.userId)))
      .limit(1)
    viewerHasCharmed = Boolean(charmRow)
  }

  const { profileId: _omit, ...pub } = row
  return {
    ...pub,
    horoscopeMatch,
    isOwner: row.userId === me.id,
    viewerHasLiked,
    viewerHasCharmed,
    interests: interests.map((i) => i.name),
    prompts,
    reel,
  }
}

export type ChemistryData = {
  matchId: string
  starters: { id: string; text: string; context: string | null }[]
  sharedInterests: string[]
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

  // Interests both members list in their Top 8.
  const interestRows = await dbc
    .select({ name: schema.interests.name })
    .from(schema.profileInterests)
    .innerJoin(schema.profiles, eq(schema.profileInterests.profileId, schema.profiles.id))
    .innerJoin(schema.interests, eq(schema.profileInterests.interestId, schema.interests.id))
    .where(inArray(schema.profiles.userId, [me.id, otherId]))
  const interestCounts = new Map<string, number>()
  for (const { name } of interestRows) interestCounts.set(name, (interestCounts.get(name) ?? 0) + 1)
  const sharedInterests = [...interestCounts.entries()]
    .filter(([, n]) => n >= 2)
    .map(([name]) => name)

  return { matchId, starters, sharedInterests, you, them }
}

export type ReceivedCharm = {
  fromUserId: string
  username: string
  displayName: string
  reelThumb: string | null
  kind: string
  message: string | null
  createdAt: Date
}

export type MyChemistry = {
  activeMatch:
    | {
        matchId: string
        username: string
        displayName: string
        mood: string | null
        reelThumb: string | null
      }
    | null
  receivedCharms: ReceivedCharm[]
}

/**
 * The signed-in user's ReelChemistry home: their one active match (if any) plus
 * the private charms others have sent them (reactions on their own reel frames).
 * Charms are recipient-only — never shown publicly or as counts.
 */
export async function getMyChemistry(): Promise<MyChemistry> {
  const me = await requireUser()
  const dbc = db()
  const hidden = await blockedIdsFor(me.id)

  // Active match (one at a time).
  const [match] = await dbc
    .select()
    .from(schema.matches)
    .where(
      and(
        eq(schema.matches.status, 'active'),
        or(eq(schema.matches.userAId, me.id), eq(schema.matches.userBId, me.id)),
      ),
    )
    .limit(1)

  let activeMatch: MyChemistry['activeMatch'] = null
  if (match) {
    const otherId = match.userAId === me.id ? match.userBId : match.userAId
    const [r] = await dbc
      .select({
        username: schema.profiles.username,
        displayName: schema.users.displayName,
        mood: schema.profiles.moodStatus,
      })
      .from(schema.profiles)
      .innerJoin(schema.users, eq(schema.profiles.userId, schema.users.id))
      .where(eq(schema.profiles.userId, otherId))
      .limit(1)
    if (r) {
      const [thumb] = await dbc
        .select({ url: schema.mediaItems.mediaUrl })
        .from(schema.memoryReels)
        .innerJoin(schema.reelFrames, eq(schema.reelFrames.reelId, schema.memoryReels.id))
        .innerJoin(schema.mediaItems, eq(schema.reelFrames.mediaItemId, schema.mediaItems.id))
        .where(and(eq(schema.memoryReels.userId, otherId), eq(schema.memoryReels.isActive, true)))
        .orderBy(asc(schema.reelFrames.position))
        .limit(1)
      activeMatch = {
        matchId: match.id,
        username: r.username,
        displayName: r.displayName,
        mood: r.mood,
        reelThumb: thumb?.url ?? null,
      }
    }
  }

  // Private received charms: reactions on my own reel frames, from active, non-blocked users.
  const charmRows = await dbc
    .select({
      fromUserId: schema.reelReactions.reactorUserId,
      kind: schema.reelReactions.reactionType,
      message: schema.reelReactions.message,
      createdAt: schema.reelReactions.createdAt,
      username: schema.profiles.username,
      displayName: schema.users.displayName,
    })
    .from(schema.reelReactions)
    .innerJoin(schema.reelFrames, eq(schema.reelReactions.reelFrameId, schema.reelFrames.id))
    .innerJoin(schema.memoryReels, eq(schema.reelFrames.reelId, schema.memoryReels.id))
    .innerJoin(schema.users, eq(schema.reelReactions.reactorUserId, schema.users.id))
    .innerJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .where(
      and(
        eq(schema.memoryReels.userId, me.id),
        ne(schema.reelReactions.reactorUserId, me.id),
        eq(schema.users.status, 'active'),
        eq(schema.profiles.status, 'active'),
      ),
    )
    .orderBy(desc(schema.reelReactions.createdAt))

  // Newest charm per sender, blocked senders excluded.
  const seen = new Set<string>()
  const receivedCharms: ReceivedCharm[] = []
  for (const row of charmRows) {
    if (hidden.includes(row.fromUserId)) continue
    if (seen.has(row.fromUserId)) continue
    seen.add(row.fromUserId)
    const [thumb] = await dbc
      .select({ url: schema.mediaItems.mediaUrl })
      .from(schema.memoryReels)
      .innerJoin(schema.reelFrames, eq(schema.reelFrames.reelId, schema.memoryReels.id))
      .innerJoin(schema.mediaItems, eq(schema.reelFrames.mediaItemId, schema.mediaItems.id))
      .where(and(eq(schema.memoryReels.userId, row.fromUserId), eq(schema.memoryReels.isActive, true)))
      .orderBy(asc(schema.reelFrames.position))
      .limit(1)
    receivedCharms.push({
      fromUserId: row.fromUserId,
      username: row.username,
      displayName: row.displayName,
      reelThumb: thumb?.url ?? null,
      kind: row.kind,
      message: row.message,
      createdAt: row.createdAt,
    })
  }

  return { activeMatch, receivedCharms }
}

export type ChatMessage = {
  id: string
  senderUserId: string
  body: string
  createdAt: Date
  readAt: Date | null
}

export type ActiveConversation = {
  matchId: string
  meId: string
  partner: {
    username: string
    displayName: string
    reelThumb: string | null
  }
  messages: ChatMessage[]
  unreadCount: number
}

/**
 * The signed-in user's active match conversation for chat polling.
 * When `after` is set, returns only messages newer than that timestamp;
 * otherwise returns the most recent 50 messages (ascending).
 */
export async function getActiveConversation(after?: Date): Promise<ActiveConversation | null> {
  const me = await requireUser()
  const dbc = db()

  const [match] = await dbc
    .select()
    .from(schema.matches)
    .where(
      and(
        eq(schema.matches.status, 'active'),
        or(eq(schema.matches.userAId, me.id), eq(schema.matches.userBId, me.id)),
      ),
    )
    .limit(1)
  if (!match) return null

  const otherId = match.userAId === me.id ? match.userBId : match.userAId
  const hidden = await blockedIdsFor(me.id)
  if (hidden.includes(otherId)) return null

  const [partnerRow] = await dbc
    .select({
      username: schema.profiles.username,
      displayName: schema.users.displayName,
    })
    .from(schema.profiles)
    .innerJoin(schema.users, eq(schema.profiles.userId, schema.users.id))
    .where(eq(schema.profiles.userId, otherId))
    .limit(1)
  if (!partnerRow) return null

  const [thumb] = await dbc
    .select({ url: schema.mediaItems.mediaUrl })
    .from(schema.memoryReels)
    .innerJoin(schema.reelFrames, eq(schema.reelFrames.reelId, schema.memoryReels.id))
    .innerJoin(schema.mediaItems, eq(schema.reelFrames.mediaItemId, schema.mediaItems.id))
    .where(and(eq(schema.memoryReels.userId, otherId), eq(schema.memoryReels.isActive, true)))
    .orderBy(asc(schema.reelFrames.position))
    .limit(1)

  const messageWhere = after
    ? and(eq(schema.messages.matchId, match.id), gt(schema.messages.createdAt, after))
    : eq(schema.messages.matchId, match.id)

  const messageRows = await dbc
    .select({
      id: schema.messages.id,
      senderUserId: schema.messages.senderUserId,
      body: schema.messages.body,
      createdAt: schema.messages.createdAt,
      readAt: schema.messages.readAt,
    })
    .from(schema.messages)
    .where(messageWhere)
    .orderBy(asc(schema.messages.createdAt))
    .limit(after ? 100 : 50)

  const [unread] = await dbc
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.messages)
    .where(
      and(
        eq(schema.messages.matchId, match.id),
        ne(schema.messages.senderUserId, me.id),
        isNull(schema.messages.readAt),
      ),
    )

  return {
    matchId: match.id,
    meId: me.id,
    partner: {
      username: partnerRow.username,
      displayName: partnerRow.displayName,
      reelThumb: thumb?.url ?? null,
    },
    messages: messageRows,
    unreadCount: unread?.count ?? 0,
  }
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
