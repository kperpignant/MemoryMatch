/**
 * MemoryMatch schema — PRD §19, Aurora PostgreSQL.
 *
 * Enums are TEXT with documented allowed values (CHECKs where useful) per the
 * PRD's enum note; Zod validates at the app boundary. Table/column names can
 * be adjusted before the first `db:push` — nothing else references raw SQL names.
 */
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

// 1) users — identity synced from Clerk; age + status for safety/privacy
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authProviderId: text('auth_provider_id').unique().notNull(), // Clerk user id
    email: text('email').unique().notNull(),
    displayName: text('display_name').notNull(),
    dateOfBirth: date('date_of_birth').notNull(), // 18+ gate; sensitive PII
    status: text('status').notNull().default('active'), // 'active' | 'suspended' | 'deleted'
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_users_status').on(t.status)],
)

// 2) beats — the 4 reusable background tracks we provide (human-made in Strudel)
export const beats = pgTable('beats', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  vibe: text('vibe').notNull(),
  audioUrl: text('audio_url').notNull(),
  creatorName: text('creator_name').notNull().default('Calvin'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// 3) interests — seeded list
export const interests = pgTable(
  'interests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    category: text('category'),
  },
  (t) => [uniqueIndex('uq_interests_name').on(sql`lower(${t.name})`)],
)

// 4) prompts — seeded list
export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptText: text('prompt_text').notNull(),
  category: text('category'),
})

// 5) profiles — 1:1 with users; status for moderation visibility
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    username: text('username').unique().notNull(),
    bio: text('bio'),
    avatarUrl: text('avatar_url'), // profile picture (Vercel Blob URL); null = initials
    datingIntent: text('dating_intent').notNull().default('open_to_dating'),
    softLaunchModeEnabled: boolean('soft_launch_mode_enabled').notNull().default(true),
    moodStatus: text('mood_status'),
    profileTheme: text('profile_theme').notNull().default('soft_pixel_romance'),
    city: text('city'),
    state: text('state'), // e.g. 'OR' — coarse city-level location only
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    status: text('status').notNull().default('active'), // 'active' | 'hidden' | 'suspended'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_profiles_status').on(t.status),
    index('idx_profiles_lat_lng').on(t.latitude, t.longitude),
  ],
)

// 6) media_items — moderation + basic validation metadata
export const mediaItems = pgTable(
  'media_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mediaUrl: text('media_url').notNull(),
    mediaType: text('media_type').notNull().default('image'), // 'image' | 'clip'
    caption: text('caption'),
    moderationStatus: text('moderation_status').notNull().default('approved'), // 'pending' | 'approved' | 'rejected'
    bytes: integer('bytes'),
    width: integer('width'),
    height: integer('height'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_media_user').on(t.userId)],
)

// 7) memory_reels
export const memoryReels = pgTable(
  'memory_reels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title'),
    vibe: text('vibe'),
    beatId: uuid('beat_id').references(() => beats.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_reels_user').on(t.userId)],
)

// 8) reel_frames
export const reelFrames = pgTable(
  'reel_frames',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reelId: uuid('reel_id')
      .notNull()
      .references(() => memoryReels.id, { onDelete: 'cascade' }),
    mediaItemId: uuid('media_item_id')
      .notNull()
      .references(() => mediaItems.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    caption: text('caption'),
    durationMs: integer('duration_ms').notNull().default(2500),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_frames_reel_position').on(t.reelId, t.position),
    index('idx_frames_reel').on(t.reelId),
  ],
)

// 9) profile_interests — Top 8, ordered
export const profileInterests = pgTable(
  'profile_interests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    interestId: uuid('interest_id')
      .notNull()
      .references(() => interests.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
  },
  (t) => [
    uniqueIndex('uq_profile_interest').on(t.profileId, t.interestId),
    uniqueIndex('uq_profile_interest_position').on(t.profileId, t.position),
    check('chk_top8_position', sql`${t.position} BETWEEN 1 AND 8`),
  ],
)

// 10) profile_prompt_answers
export const profilePromptAnswers = pgTable(
  'profile_prompt_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    promptId: uuid('prompt_id')
      .notNull()
      .references(() => prompts.id, { onDelete: 'cascade' }),
    answer: text('answer').notNull(),
  },
  (t) => [uniqueIndex('uq_profile_prompt').on(t.profileId, t.promptId)],
)

// 11) likes — directional; mutual = match; idempotent via UNIQUE
export const likes = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    likerUserId: uuid('liker_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    likedUserId: uuid('liked_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_likes_pair').on(t.likerUserId, t.likedUserId),
    index('idx_likes_liked').on(t.likedUserId),
    check('chk_no_self_like', sql`${t.likerUserId} <> ${t.likedUserId}`),
  ],
)

// 12) reel_reactions — Charms on a specific frame
export const reelReactions = pgTable(
  'reel_reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reactorUserId: uuid('reactor_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reelFrameId: uuid('reel_frame_id')
      .notNull()
      .references(() => reelFrames.id, { onDelete: 'cascade' }),
    reactionType: text('reaction_type').notNull(), // 'wave' | 'charm' | 'sticker' | 'note'
    message: text('message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_reactions_frame').on(t.reelFrameId)],
)

// 13) matches — canonical ordering (user_a < user_b) prevents duplicates
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userAId: uuid('user_a_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userBId: uuid('user_b_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('active'), // 'active' | 'closed' (e.g. after a block)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_matches_pair').on(t.userAId, t.userBId),
    check('chk_match_order', sql`${t.userAId} < ${t.userBId}`),
  ],
)

// 14) conversation_starters — per match
export const conversationStarters = pgTable(
  'conversation_starters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    starterText: text('starter_text').notNull(),
    sourceContext: text('source_context'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_starters_match').on(t.matchId)],
)

// 15) blocks — bidirectional invisibility + interaction prevention
export const blocks = pgTable(
  'blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockerUserId: uuid('blocker_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedUserId: uuid('blocked_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_blocks_pair').on(t.blockerUserId, t.blockedUserId),
    index('idx_blocks_blocker').on(t.blockerUserId),
    index('idx_blocks_blocked').on(t.blockedUserId),
    check('chk_no_self_block', sql`${t.blockerUserId} <> ${t.blockedUserId}`),
  ],
)

// 16) reports — user/content reports with reason + review status
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterUserId: uuid('reporter_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reportedUserId: uuid('reported_user_id').references(() => users.id, { onDelete: 'cascade' }),
    reportedReelFrameId: uuid('reported_reel_frame_id').references(() => reelFrames.id, {
      onDelete: 'set null',
    }),
    reportedReactionId: uuid('reported_reaction_id').references(() => reelReactions.id, {
      onDelete: 'set null',
    }),
    reason: text('reason').notNull(), // 'harassment'|'inappropriate'|'spam'|'impersonation'|'safety'|'other'
    details: text('details'),
    status: text('status').notNull().default('open'), // 'open'|'reviewing'|'actioned'|'dismissed'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_reports_status').on(t.status)],
)

// 17) audit_events — lightweight audit trail for sensitive actions
export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(), // 'block'|'unblock'|'report'|'account_delete'|'profile_update'|...
    targetType: text('target_type'),
    targetId: uuid('target_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_audit_actor').on(t.actorUserId)],
)
