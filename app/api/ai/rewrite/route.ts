import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { resolveProviderConfig } from '@/lib/ai/user-keys'
import { stream } from '@/lib/ai/providers'

export const dynamic = 'force-dynamic'

const SYSTEM = `You are an expert writing assistant. Improve grammar, clarity, structure, and professionalism while preserving the author's voice and intent. Return only the rewritten content — no commentary, no preamble.`

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, selection } = await req.json()
  const target = selection || content
  if (!target?.trim()) return Response.json({ error: 'No content' }, { status: 400 })

  const config = await resolveProviderConfig(userId)
  const plain = target.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const prompt = selection
    ? `Rewrite and improve this text:\n\n${plain}`
    : `Rewrite and enhance this note:\nTitle: ${title ?? 'Untitled'}\n\n${plain}`

  try {
    const readable = await stream(config, prompt, SYSTEM)
    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: unknown) {
    console.error('[rewrite]', err)
    return Response.json({ error: err instanceof Error ? err.message : 'AI error' }, { status: 502 })
  }
}
