import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import type { EncryptedKey } from './types'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.USER_KEY_ENCRYPTION_SECRET
  if (!hex || hex.length !== 64) throw new Error('USER_KEY_ENCRYPTION_SECRET must be 64 hex chars')
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string): EncryptedKey {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const encrypted = cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex')
  return { encrypted, iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex') }
}

export function decrypt(payload: EncryptedKey): string {
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(payload.iv, 'hex'))
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'))
  return decipher.update(payload.encrypted, 'hex', 'utf8') + decipher.final('utf8')
}
