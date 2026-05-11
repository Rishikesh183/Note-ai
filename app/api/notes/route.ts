import { auth } from '@clerk/nextjs/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

function userNotes(userId: string) {
  return adminDb.collection('users').doc(userId).collection('notes')
}

function formatNote(id: string, data: FirebaseFirestore.DocumentData) {
  const updatedAt = data.updatedAt?.toDate?.() ?? new Date()
  const createdAt = data.createdAt?.toDate?.() ?? new Date()
  const content   = data.content ?? ''
  return {
    id,
    title:     data.title    ?? 'Untitled',
    content,
    preview:   data.preview  ?? content.replace(/[#*_`[\]]/g, '').slice(0, 120),
    favorite:  data.favorite ?? false,
    public:    data.public   ?? false,
    category:  data.category ?? 'all',
    wordCount: content.trim() ? content.trim().split(/\s+/).length : 0,
    updatedAt: updatedAt.toISOString(),
    createdAt: createdAt.toISOString(),
  }
}

/* GET /api/notes — list all notes for the signed-in user */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const snap = await userNotes(userId).orderBy('updatedAt', 'desc').get()
    const notes = snap.docs.map((d) => formatNote(d.id, d.data()))
    return Response.json({ notes })
  } catch (err) {
    console.error('[GET /api/notes]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/* POST /api/notes — create a new note */
export async function POST(_req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const now = FieldValue.serverTimestamp()
  try {
    const ref = await userNotes(userId).add({
      title:     'Untitled Note',
      content:   '',
      preview:   'Start writing...',
      favorite:  false,
      category:  'all',
      createdAt: now,
      updatedAt: now,
    })

    const snap = await ref.get()
    const note = formatNote(ref.id, snap.data()!)
    return Response.json({ note }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/notes]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
