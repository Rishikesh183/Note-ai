import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { encrypt } from '@/lib/ai/encryption'
import type { AIProvider } from '@/lib/ai/types'

export const dynamic = 'force-dynamic'

const settingsRef = (userId: string) =>
  adminDb.collection('users').doc(userId).collection('settings').doc('aiKeys')

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const snap = await settingsRef(userId).get()
  if (!snap.exists) return Response.json({ configured: [], activeProvider: null })

  const data = snap.data()!
  const providers: AIProvider[] = ['gemini', 'openai', 'groq', 'openrouter', 'custom']
  const configured = providers.filter(p => !!data[p]?.encrypted)

  return Response.json({ configured, activeProvider: data.activeProvider ?? null })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider, apiKey, model, baseUrl } = await req.json()
  if (!provider || !apiKey?.trim()) {
    return Response.json({ error: 'provider and apiKey required' }, { status: 400 })
  }

  const encrypted = encrypt(apiKey.trim())
  const update: Record<string, unknown> = { [provider]: encrypted, activeProvider: provider }
  if (model) update[`${provider}_model`] = model
  if (baseUrl) update[`${provider}_base_url`] = baseUrl

  await settingsRef(userId).set(update, { merge: true })
  return Response.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider } = await req.json()
  if (!provider) return Response.json({ error: 'provider required' }, { status: 400 })

  await settingsRef(userId).update({
    [provider]: FieldValue.delete(),
    [`${provider}_model`]: FieldValue.delete(),
    [`${provider}_base_url`]: FieldValue.delete(),
  })
  return Response.json({ ok: true })
}
