/**
 * Clerk → DB user sync (PRD Flow 0, §31).
 *
 * Clerk posts user.created / user.updated / user.deleted; we verify the Svix
 * signature and upsert/deactivate the row in `users`. Date of birth comes from
 * unsafe_metadata.date_of_birth captured at signup (the 18+ gate re-validates
 * server-side here — under-18 accounts are never activated).
 */
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { eq, sql } from 'drizzle-orm'
import { db, schema } from '@/lib/db'

type ClerkUserPayload = {
  id: string
  email_addresses?: { email_address: string; id: string }[]
  primary_email_address_id?: string
  first_name?: string | null
  last_name?: string | null
  unsafe_metadata?: { date_of_birth?: string }
}

function primaryEmail(u: ClerkUserPayload): string | null {
  const list = u.email_addresses ?? []
  return (
    list.find((e) => e.id === u.primary_email_address_id)?.email_address ??
    list[0]?.email_address ??
    null
  )
}

function isAtLeast18(dobIso: string): boolean {
  const dob = new Date(dobIso)
  if (Number.isNaN(dob.getTime())) return false
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return dob <= cutoff
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 503 })
  }

  const payload = await req.text()
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  }

  let evt: { type: string; data: ClerkUserPayload }
  try {
    evt = new Webhook(secret).verify(payload, headers) as typeof evt
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const { type, data } = evt

  if (type === 'user.created' || type === 'user.updated') {
    const email = primaryEmail(data)
    if (!email) return NextResponse.json({ error: 'no email on user' }, { status: 422 })

    const dob = data.unsafe_metadata?.date_of_birth
    if (!dob || !isAtLeast18(dob)) {
      // 18+ gate: never activate an under-18 / no-DOB account (PRD §11.3)
      return NextResponse.json({ ok: true, skipped: 'age gate' })
    }

    const displayName =
      [data.first_name, data.last_name].filter(Boolean).join(' ') || email.split('@')[0]

    await db()
      .insert(schema.users)
      .values({
        authProviderId: data.id,
        email,
        displayName,
        dateOfBirth: dob,
      })
      .onConflictDoUpdate({
        target: schema.users.authProviderId,
        set: { email, displayName, updatedAt: sql`now()` },
      })
    return NextResponse.json({ ok: true })
  }

  if (type === 'user.deleted') {
    await db()
      .update(schema.users)
      .set({ status: 'deleted', deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(schema.users.authProviderId, data.id))
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true, ignored: type })
}
