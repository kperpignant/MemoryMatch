/**
 * Image upload → Vercel Blob (PRD §15 media). Stores the binary in Blob and
 * returns a public URL; only that URL is ever persisted in Aurora.
 * Auth-gated (signed-in users only) and image-only, capped at ~8MB.
 */
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

const MAX_BYTES = 8 * 1024 * 1024

export async function POST(req: Request) {
  try {
    await requireUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Uploads not configured — set BLOB_READ_WRITE_TOKEN' },
      { status: 503 },
    )
  }

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Images only' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 8MB)' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const blob = await put(`reels/${crypto.randomUUID()}.${ext}`, file, {
    access: 'public',
    contentType: file.type,
  })

  return NextResponse.json({ url: blob.url })
}
