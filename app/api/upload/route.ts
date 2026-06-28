/**
 * Image upload (PRD §15 media). In production the binary goes to Vercel Blob
 * and only its public URL is persisted in Aurora. In local dev (no Blob store
 * required) the file is written under public/uploads so the whole flow can be
 * tested without any cloud config. Auth-gated, image-only, capped at ~8MB.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

const MAX_BYTES = 8 * 1024 * 1024

// Use real Blob only in production (or if a token is set and we're not in dev).
// `next dev` writes to disk so uploads work with zero Blob setup.
const useBlob =
  process.env.NODE_ENV === 'production' && Boolean(process.env.BLOB_READ_WRITE_TOKEN)

export async function POST(req: Request) {
  try {
    await requireUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
  const name = `${crypto.randomUUID()}.${ext}`

  if (useBlob) {
    const blob = await put(`reels/${name}`, file, {
      access: 'public',
      contentType: file.type,
    })
    return NextResponse.json({ url: blob.url })
  }

  // Local dev fallback — persist under public/uploads/reels and serve it back.
  const dir = join(process.cwd(), 'public', 'uploads', 'reels')
  await mkdir(dir, { recursive: true })
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(join(dir, name), bytes)
  return NextResponse.json({ url: `/uploads/reels/${name}` })
}
