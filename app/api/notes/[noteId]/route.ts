import { auth } from '@clerk/nextjs/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

function noteRef(userId: string, noteId: string) {
  return adminDb.collection('users').doc(userId).collection('notes').doc(noteId)
}

/* PATCH /api/notes/[noteId] — partial update (autosave diff) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { noteId } = await params
  if (!noteId) return Response.json({ error: 'Missing noteId' }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  /* Only allow safe fields */
  const allowed = ['title', 'content', 'favorite', 'category'] as const
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ ok: true })
  }

  /* Auto-generate preview from content diff */
  if (typeof patch.content === 'string') {
    patch.preview = (patch.content as string).replace(/[#*_`[\]]/g, '').slice(0, 120)
  }

  patch.updatedAt = FieldValue.serverTimestamp()

  try {
    const ref = noteRef(userId, noteId)
    const existing = await ref.get()
    if (!existing.exists) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
    await ref.update(patch)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/notes]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/* DELETE /api/notes/[noteId] */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { noteId } = await params
  if (!noteId) return Response.json({ error: 'Missing noteId' }, { status: 400 })

  try {
    await noteRef(userId, noteId).delete()
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/notes]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
