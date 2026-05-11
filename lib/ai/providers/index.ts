import { geminiStream, geminiGenerate, geminiEmbed } from './gemini'
import { openaiStream, openaiGenerate } from './openai-compatible'
import type { AIProvider, AIProviderConfig } from '../types'

const BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
}

function buildEnvConfig(p: AIProvider, autocomplete: boolean): AIProviderConfig {
  const suffix = autocomplete ? '_AUTOCOMPLETE_MODEL' : '_MODEL'
  switch (p) {
    case 'openai': return {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY ?? '',
      model: process.env[`OPENAI${suffix}`] ?? 'gpt-4o-mini',
      baseUrl: BASE_URLS.openai,
    }
    case 'groq': return {
      provider: 'groq',
      apiKey: process.env.GROQ_API_KEY ?? '',
      model: process.env[`GROQ${suffix}`] ?? (autocomplete ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile'),
      baseUrl: BASE_URLS.groq,
    }
    case 'openrouter': return {
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY ?? '',
      // free models: google/gemini-2.0-flash-exp:free  google/gemma-4-31b-it:free
      model: process.env[`OPENROUTER${suffix}`] ?? (autocomplete ? 'google/gemini-2.0-flash-exp:free' : 'google/gemini-2.0-flash-exp:free'),
      baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
    }
    default: return {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY ?? '',
      // free tier: gemini-2.5-flash (10 RPM) | autocomplete: gemini-2.0-flash-lite (15 RPM)
      model: process.env[`GEMINI${suffix}`] ?? (autocomplete ? 'gemini-2.0-flash-lite' : 'gemini-2.5-flash'),
    }
  }
}

export function defaultConfig(): AIProviderConfig {
  return buildEnvConfig((process.env.AI_DEFAULT_PROVIDER ?? 'gemini') as AIProvider, false)
}

export function autocompleteConfig(): AIProviderConfig {
  return buildEnvConfig((process.env.AI_DEFAULT_PROVIDER ?? 'gemini') as AIProvider, true)
}

export async function stream(
  config: AIProviderConfig,
  prompt: string,
  system?: string,
): Promise<ReadableStream<Uint8Array>> {
  if (config.provider === 'gemini') {
    return geminiStream(config.apiKey, config.model, prompt, system)
  }
  return openaiStream(
    config.apiKey,
    config.baseUrl!,
    config.model,
    [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: prompt }],
  )
}

export async function generate(
  config: AIProviderConfig,
  prompt: string,
  maxTokens = 80,
): Promise<string> {
  if (config.provider === 'gemini') {
    return geminiGenerate(config.apiKey, config.model, prompt, maxTokens)
  }
  return openaiGenerate(config.apiKey, config.baseUrl!, config.model, [{ role: 'user', content: prompt }], maxTokens)
}

export async function embed(text: string): Promise<number[]> {
  if ((process.env.EMBEDDING_PROVIDER ?? 'gemini') === 'openai') {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small', input: text }),
    })
    if (!res.ok) throw new Error(`Embed ${res.status}`)
    return (await res.json()).data[0].embedding as number[]
  }
  return geminiEmbed(
    process.env.GEMINI_API_KEY ?? '',
    process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
    text,
  )
}
