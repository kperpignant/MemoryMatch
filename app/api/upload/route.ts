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
import { requireSession } from '@/lib/auth'

const MAX_BYTES = 8 * 1024 * 1024

// iPhones shoot HEIC by default and browsers can't render it, so convert to
// JPEG on upload. Detect by MIME or extension (HEIC files sometimes arrive with
// an empty type).
function isHeic(file: File): boolean {
  const t = file.type.toLowerCase()
  if (t === 'image/heic' || t === 'image/heif') return true
  const name = file.name.toLowerCase()
  return name.endsWith('.heic') || name.endsWith('.heif')
}

async function toStorable(
  file: File,
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  const input = Buffer.from(await file.arrayBuffer())
  if (isHeic(file)) {
    const { default: convert } = await import('heic-convert')
    const output = await convert({ buffer: input, format: 'JPEG', quality: 0.9 })
    return { buffer: Buffer.from(output), ext: 'jpg', contentType: 'image/jpeg' }
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  return { buffer: input, ext, contentType: file.type || 'image/jpeg' }
}

// Use real Blob only in production (or if a token is set and we're not in dev).
// `next dev` writes to disk so uploads work with zero Blob setup.
const useBlob =
  process.env.NODE_ENV === 'production' && Boolean(process.env.BLOB_READ_WRITE_TOKEN)

export async function POST(req: Request) {
  try {
    await requireSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  // Accept anything that's an image MIME or a HEIC/HEIF file (which often
  // arrives with an empty type).
  if (!file.type.startsWith('image/') && !isHeic(file)) {
    return NextResponse.json({ error: 'Images only' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 8MB)' }, { status: 400 })
  }

  let stored: Awaited<ReturnType<typeof toStorable>>
  try {
    stored = await toStorable(file)
  } catch {
    return NextResponse.json({ error: "Couldn't process that image — try a JPG or PNG" }, { status: 422 })
  }
  const name = `${crypto.randomUUID()}.${stored.ext}`

  if (useBlob) {
    const blob = await put(`reels/${name}`, stored.buffer, {
      access: 'public',
      contentType: stored.contentType,
    })
    return NextResponse.json({ url: blob.url })
  }

  // Local dev fallback — persist under public/uploads/reels and serve it back.
  const dir = join(process.cwd(), 'public', 'uploads', 'reels')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, name), stored.buffer)
  return NextResponse.json({ url: `/uploads/reels/${name}` })
}
