const BASE = 'https://generativelanguage.googleapis.com/v1beta'

export async function geminiStream(
  apiKey: string,
  model: string,
  prompt: string,
  system?: string,
): Promise<ReadableStream<Uint8Array>> {
  const url = `${BASE}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      ...(system && { systemInstruction: { parts: [{ text: system }] } }),
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  if (!res.body) throw new Error('No response body')

  const enc = new TextEncoder()
  const dec = new TextDecoder()
  return res.body.pipeThrough(
    new TransformStream({
      transform(chunk, ctrl) {
        for (const line of dec.decode(chunk).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') return
          try {
            const text = JSON.parse(raw)?.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) ctrl.enqueue(enc.encode(text))
          } catch { /* skip malformed */ }
        }
      },
    }),
  )
}

export async function geminiGenerate(
  apiKey: string,
  model: string,
  prompt: string,
  maxTokens = 80,
): Promise<string> {
  const url = `${BASE}/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: maxTokens },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const json = await res.json()
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function geminiEmbed(apiKey: string, model: string, text: string): Promise<number[]> {
  const url = `${BASE}/models/${model}:embedContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // gemini-embedding-001 uses taskType; older text-embedding-004 also accepts this format
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_DOCUMENT',
    }),
  })
  if (!res.ok) throw new Error(`Gemini embed ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return (json.embedding?.values ?? []) as number[]
}
