/**
 * Block-aware read queries (PRD §19 block enforcement): every read filters
 * out blocked pairs (either direction) and non-active users/profiles.
 * Server-only — called from server components / route handlers.
 */
import { and, asc, eq, ne, notInArray, or } from 'drizzle-orm'
import { requireUser } from '@/lib/auth'
import { db, schema } from '@/lib/db'

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
}

/** Browse buddy list: active users/profiles, blocked pairs excluded, me excluded. */
export async function getBrowseList(): Promise<BuddySummary[]> {
  const me = await requireUser()
  const hidden = await blockedIdsFor(me.id)
  const dbc = db()

  const rows = await dbc
    .select({
      userId: schema.users.id,
      username: schema.profiles.username,
      displayName: schema.users.displayName,
      mood: schema.profiles.moodStatus,
      theme: schema.profiles.profileTheme,
      intent: schema.profiles.datingIntent,
    })
    .from(schema.profiles)
    .innerJoin(schema.users, eq(schema.profiles.userId, schema.users.id))
    .where(
      and(
        eq(schema.profiles.status, 'active'),
        eq(schema.users.status, 'active'),
        ne(schema.users.id, me.id),
        ...(hidden.length > 0 ? [notInArray(schema.users.id, hidden)] : []),
      ),
    )
    .orderBy(asc(schema.profiles.username))
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
    result.push({ ...row, reelThumb: thumb?.url ?? null, intent: row.intent })
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

  const { profileId: _omit, ...pub } = row
  return {
    ...pub,
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
