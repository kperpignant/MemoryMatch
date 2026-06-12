/**
 * Per-user, per-action rate limiting (PRD §32) — Upstash Redis when configured,
 * no-op in local dev so the app works before keys exist.
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const configured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
)

const limiters = new Map<string, Ratelimit>()

/** tokens allowed per minute, per action */
const LIMITS: Record<string, number> = {
  like: 30,
  reaction: 30,
  report: 10,
  block: 20,
  'profile-write': 20,
  default: 60,
}

export async function rateLimit(userId: string, action: string): Promise<{ ok: boolean }> {
  if (!configured) return { ok: true }

  let limiter = limiters.get(action)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(LIMITS[action] ?? LIMITS.default, '1 m'),
      prefix: `mm:rl:${action}`,
    })
    limiters.set(action, limiter)
  }

  const { success } = await limiter.limit(userId)
  return { ok: success }
}
