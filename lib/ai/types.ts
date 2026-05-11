export type AIProvider = 'gemini' | 'openai' | 'groq' | 'openrouter' | 'custom'

export interface AIProviderConfig {
  provider: AIProvider
  apiKey: string
  model: string
  baseUrl?: string
}

export interface EncryptedKey {
  encrypted: string
  iv: string
  tag: string
}
