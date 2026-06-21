import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { resolveProviderConfig } from '@/lib/ai/user-keys'
import { stream, embed } from '@/lib/ai/providers'

export const dynamic = 'force-dynamic'

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

function keywordScore(text: string, question: string): number {
  const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const lower = text.toLowerCase()
  return words.reduce((s, w) => s + (lower.includes(w) ? 1 : 0), 0)
}

const SYSTEM = `You are a helpful assistant with access to the user's notes. Answer questions based on the provided context. Be concise. Cite sources using [Note: Title] format. If the answer isn't in the notes, say so honestly.

When the user asks to list notes, list all notes, or asks about favourites/favorites/starred notes, use the full note index provided — do not skip any.`

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { question, history } = await req.json()
  if (!question?.trim()) return Response.json({ error: 'No question' }, { status: 400 })

  const snap = await adminDb
    .collection('users').doc(userId)
    .collection('notes')
    .orderBy('updatedAt', 'desc')
    .limit(50)
    .get()

  const notes = snap.docs
    .map(d => ({
      id: d.id,
      title: d.data().title ?? 'Untitled',
      content: stripHtml(d.data().content ?? ''),
      favorite: d.data().favorite === true,
    }))
    .filter(n => n.content.length > 20 || n.title !== 'Untitled')

  if (notes.length === 0) {
    return Response.json({ error: 'No notes to search' }, { status: 404 })
  }

  const topK = parseInt(process.env.AI_RAG_TOP_K ?? '5', 10)

  const q = question.toLowerCase()
  const isListIntent = /\b(list|show|all|every)\b.*\bnotes?\b|\bnotes?\b.*(list|all|every)/.test(q)
  const isFavIntent  = /\b(fav(ou?rite)?s?|starred|bookmarked)\b/.test(q)

  let relevantNotes: typeof notes

  if (isListIntent || isFavIntent) {
    // Bypass RAG — give AI full index (titles only to save tokens) or just favourites
    relevantNotes = isFavIntent ? notes.filter(n => n.favorite) : notes
  } else {
    // Keyword pre-filter → top 10 candidates
    const candidates = notes
      .map(n => ({ note: n, score: keywordScore(`${n.title} ${n.content}`, question) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(s => s.note)

    relevantNotes = candidates.slice(0, topK)

    // Semantic re-rank — only when explicitly enabled (free tier has 5 RPM embed limit)
    if (process.env.AI_ENABLE_EMBEDDINGS === 'true') {
      try {
        const [qEmbed, ...noteEmbeds] = await Promise.all([
          embed(question),
          ...candidates.map(n => embed(`${n.title}\n${n.content.slice(0, 512)}`)),
        ])
        relevantNotes = candidates
          .map((n, i) => ({ note: n, score: cosineSim(qEmbed, noteEmbeds[i]) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, topK)
          .map(s => s.note)
      } catch {
        // Fall back to keyword ranking
      }
    }
  }

  // For list/fav intents include only titles to stay within token budget when notes count is high
  const context = (isListIntent || isFavIntent)
    ? relevantNotes.map(n => `- [Note: ${n.title}]${n.favorite ? ' ⭐' : ''}`).join('\n')
    : relevantNotes.map(n => `[Note: ${n.title}]\n${n.content.slice(0, 800)}`).join('\n\n---\n\n')

  const historyStr = ((history ?? []) as { role: string; content: string }[])
    .slice(-4)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  const prompt = [
    'Relevant notes:',
    context,
    '',
    historyStr ? `Prior conversation:\n${historyStr}\n` : '',
    `Question: ${question}`,
  ].filter(Boolean).join('\n')

  const config = await resolveProviderConfig(userId)

  try {
    const readable = await stream(config, prompt, SYSTEM)
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Sources': JSON.stringify(relevantNotes.map(n => ({ id: n.id, title: n.title }))),
        'Access-Control-Expose-Headers': 'X-Sources',
      },
    })
  } catch (err: unknown) {
    console.error('[chat]', err)
    return Response.json({ error: err instanceof Error ? err.message : 'AI error' }, { status: 502 })
  }
}
