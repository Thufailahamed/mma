import { base64UrlEncode } from './encoding'

const TOKEN_BYTES = 32

export function generateSessionToken(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)))
}

/**
 * Sessions store only this hash. A database dump therefore yields no usable
 * session token.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
