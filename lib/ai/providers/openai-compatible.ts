type Msg = { role: string; content: string }

export async function openaiStream(
  apiKey: string,
  baseUrl: string,
  model: string,
  messages: Msg[],
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: true, temperature: 0.7, max_tokens: 4096 }),
  })
  if (!res.ok) throw new Error(`Provider ${res.status}: ${await res.text()}`)
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
            const delta = JSON.parse(raw)?.choices?.[0]?.delta?.content
            if (delta) ctrl.enqueue(enc.encode(delta))
          } catch { /* skip */ }
        }
      },
    }),
  )
}

export async function openaiGenerate(
  apiKey: string,
  baseUrl: string,
  model: string,
  messages: Msg[],
  maxTokens = 80,
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: false, temperature: 0.5, max_tokens: maxTokens }),
  })
  if (!res.ok) throw new Error(`Provider ${res.status}`)
  return (await res.json())?.choices?.[0]?.message?.content ?? ''
}
