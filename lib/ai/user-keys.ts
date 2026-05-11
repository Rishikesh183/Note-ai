import { adminDb } from '@/lib/firebase-admin'
import { decrypt } from './encryption'
import { defaultConfig } from './providers'
import type { AIProvider, AIProviderConfig, EncryptedKey } from './types'

const BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
}

export async function resolveProviderConfig(userId: string): Promise<AIProviderConfig> {
  try {
    const snap = await adminDb
      .collection('users').doc(userId)
      .collection('settings').doc('aiKeys')
      .get()
    if (!snap.exists) return defaultConfig()

    const data = snap.data()!
    const active = (data.activeProvider ?? process.env.AI_DEFAULT_PROVIDER ?? 'gemini') as AIProvider
    const keyData = data[active] as EncryptedKey | undefined
    if (!keyData?.encrypted) return defaultConfig()

    const apiKey = decrypt(keyData)
    const model = (data[`${active}_model`] as string | undefined)

    switch (active) {
      case 'gemini':
        return { provider: 'gemini', apiKey, model: model ?? 'gemini-1.5-flash' }
      case 'openai':
        return { provider: 'openai', apiKey, model: model ?? 'gpt-4o-mini', baseUrl: BASE_URLS.openai }
      case 'groq':
        return { provider: 'groq', apiKey, model: model ?? 'llama-3.3-70b-versatile', baseUrl: BASE_URLS.groq }
      case 'openrouter':
        return {
          provider: 'openrouter',
          apiKey,
          model: model ?? 'google/gemini-flash-1.5',
          baseUrl: (data.openrouter_base_url as string | undefined) ?? 'https://openrouter.ai/api/v1',
        }
      case 'custom':
        return { provider: 'custom', apiKey, model: model ?? '', baseUrl: data.custom_base_url as string ?? '' }
      default:
        return defaultConfig()
    }
  } catch {
    return defaultConfig()
  }
}
