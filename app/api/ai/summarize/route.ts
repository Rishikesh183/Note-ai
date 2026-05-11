import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { resolveProviderConfig } from '@/lib/ai/user-keys'
import { stream } from '@/lib/ai/providers'

export const dynamic = 'force-dynamic'

const SYSTEM = `You are a precise, intelligent note summarizer. Create concise and readable summaries that capture the key points, decisions, and action items. Use clear prose. Never add filler or meta-commentary.`

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content } = await req.json()
  if (!content?.trim()) return Response.json({ error: 'No content' }, { status: 400 })

  const config = await resolveProviderConfig(userId)
  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const prompt = `Summarize this note:\nTitle: ${title ?? 'Untitled'}\n\n${plain}`

  try {
    const readable = await stream(config, prompt, SYSTEM)
    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: unknown) {
    console.error('[summarize]', err)
    return Response.json({ error: err instanceof Error ? err.message : 'AI error' }, { status: 502 })
  }
}
