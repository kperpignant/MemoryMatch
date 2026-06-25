'use server'

/**
 * Profile mutations (PRD §15): onboarding completion + profile edits.
 * Identity always comes from the session (requireUser) — never the client.
 *
 * UI ids use dashes ('soft-pixel-romance'); the DB stores underscores
 * ('soft_pixel_romance') per the PRD's documented values — converted here.
 */
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { rateLimit } from '@/lib/ratelimit'

const THEME_IDS = [
  'soft-pixel-romance',
  'late-night-aim',
  'cyber-cafe',
  'arcade-crush',
  'dreamcast-summer',
] as const

const INTENT_IDS = [
  'open-to-dating',
  'slow-burn',
  'friend-first',
  'just-browsing',
  'co-op-mode',
  'social-discovery',
] as const

const toDb = (id: string) => id.replace(/-/g, '_')
const toUi = (v: string) => v.replace(/_/g, '-')

/** Current profile in UI shape, for prefilling the edit wizard. Null if none. */
export async function getProfileForEdit() {
  const me = await requireUser()
  const dbc = db()
  const [p] = await dbc
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, me.id))
    .limit(1)
  if (!p) return null

  const ints = await dbc
    .select({ name: schema.interests.name })
    .from(schema.profileInterests)
    .innerJoin(schema.interests, eq(schema.profileInterests.interestId, schema.interests.id))
    .where(eq(schema.profileInterests.profileId, p.id))
    .orderBy(asc(schema.profileInterests.position))

  return {
    username: p.username,
    displayName: me.displayName,
    intents: [toUi(p.datingIntent)],
    softLaunch: p.softLaunchModeEnabled,
    theme: toUi(p.profileTheme),
    bio: p.bio ?? '',
    mood: p.moodStatus ?? '',
    avatarUrl: p.avatarUrl ?? '',
    interests: ints.map((i) => i.name),
    dateOfBirth: me.dateOfBirth ? String(me.dateOfBirth).slice(0, 10) : '',
  }
}

const onboardingInput = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, hyphens, and underscores only'),
  displayName: z.string().trim().min(1).max(50),
  intent: z.enum(INTENT_IDS).default('open-to-dating'),
  softLaunch: z.boolean().default(true),
  theme: z.enum(THEME_IDS).default('soft-pixel-romance'),
  bio: z.string().max(500).optional(),
  mood: z.string().max(80).optional(),
  avatarUrl: z.string().url().max(2048).optional(),
  /** Top 8, ordered; free-text allowed (upserted into `interests`) */
  interests: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
})

export type OnboardingResult =
  | { ok: true; username: string }
  | { ok: false; error: string }

export async function completeOnboarding(
  input: z.infer<typeof onboardingInput>,
): Promise<OnboardingResult> {
  const data = onboardingInput.parse(input)
  const me = await requireUser()

  const { ok } = await rateLimit(me.id, 'profile_save')
  if (!ok) return { ok: false, error: 'Too many requests — try again in a minute' }

  const dbc = db()

  // Username uniqueness (excluding my own row, so re-running onboarding is safe)
  const [taken] = await dbc
    .select({ userId: schema.profiles.userId })
    .from(schema.profiles)
    .where(eq(schema.profiles.username, data.username))
    .limit(1)
  if (taken && taken.userId !== me.id) {
    return { ok: false, error: 'That username is taken — try another' }
  }

  const values = {
    username: data.username,
    bio: data.bio ?? null,
    avatarUrl: data.avatarUrl ?? null,
    datingIntent: toDb(data.intent),
    softLaunchModeEnabled: data.softLaunch,
    moodStatus: data.mood ?? null,
    profileTheme: toDb(data.theme),
    updatedAt: new Date(),
  }

  const [profile] = await dbc
    .insert(schema.profiles)
    .values({ userId: me.id, ...values })
    .onConflictDoUpdate({ target: schema.profiles.userId, set: values })
    .returning({ id: schema.profiles.id })

  await replaceTop8(profile.id, data.interests)

  if (data.displayName !== me.displayName) {
    await dbc
      .update(schema.users)
      .set({ displayName: data.displayName, updatedAt: new Date() })
      .where(eq(schema.users.id, me.id))
  }

  await dbc.insert(schema.auditEvents).values({
    actorUserId: me.id,
    action: 'profile_update',
    targetType: 'profile',
    targetId: profile.id,
  })

  return { ok: true, username: data.username }
}

const updateInput = onboardingInput.partial().omit({ username: true })

export async function updateProfile(input: z.infer<typeof updateInput>) {
  const data = updateInput.parse(input)
  const me = await requireUser()

  const { ok } = await rateLimit(me.id, 'profile_save')
  if (!ok) throw new Error('Too many requests')

  const dbc = db()
  const [profile] = await dbc
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, me.id))
    .limit(1)
  if (!profile) throw new Error('Complete onboarding first')

  await dbc
    .update(schema.profiles)
    .set({
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.mood !== undefined && { moodStatus: data.mood }),
      ...(data.intent && { datingIntent: toDb(data.intent) }),
      ...(data.theme && { profileTheme: toDb(data.theme) }),
      ...(data.softLaunch !== undefined && { softLaunchModeEnabled: data.softLaunch }),
      updatedAt: new Date(),
    })
    .where(eq(schema.profiles.id, profile.id))

  if (data.interests) await replaceTop8(profile.id, data.interests)
  if (data.displayName) {
    await dbc
      .update(schema.users)
      .set({ displayName: data.displayName, updatedAt: new Date() })
      .where(eq(schema.users.id, me.id))
  }
  return { ok: true }
}

/** Resolve interest names (case-insensitive, upserting free-text) and replace the ordered Top 8. */
async function replaceTop8(profileId: string, names: string[]) {
  const dbc = db()
  await dbc
    .delete(schema.profileInterests)
    .where(eq(schema.profileInterests.profileId, profileId))
  if (names.length === 0) return

  const rows: { profileId: string; interestId: string; position: number }[] = []
  for (const [i, name] of names.slice(0, 8).entries()) {
    const [existing] = await dbc
      .select({ id: schema.interests.id })
      .from(schema.interests)
      .where(sql`lower(${schema.interests.name}) = lower(${name})`)
      .limit(1)
    const id =
      existing?.id ??
      (
        await dbc
          .insert(schema.interests)
          .values({ name, category: 'custom' })
          .returning({ id: schema.interests.id })
      )[0].id
    rows.push({ profileId, interestId: id, position: i + 1 })
  }
  await dbc.insert(schema.profileInterests).values(rows)
}
