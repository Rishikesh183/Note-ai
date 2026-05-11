import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { autocompleteConfig, generate } from '@/lib/ai/providers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ suggestion: '' })

  const { text } = await req.json()
  if (!text?.trim() || text.trim().split(/\s+/).length < 3) {
    return Response.json({ suggestion: '' })
  }

  const config = autocompleteConfig()
  const last400 = text.slice(-400)
  const prompt = `Continue this text naturally. Output ONLY the continuation (max 12 words), nothing else, no quotes:\n\n${last400}`

  try {
    const maxTokens = parseInt(process.env.AI_AUTOCOMPLETE_MAX_TOKENS ?? '80', 10)
    const suggestion = await generate(config, prompt, maxTokens)
    return Response.json({ suggestion: suggestion.trim() })
  } catch {
    return Response.json({ suggestion: '' })
  }
}
