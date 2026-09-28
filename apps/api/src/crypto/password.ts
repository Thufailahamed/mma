import { base64Decode, base64Encode, timingSafeEqual } from './encoding'

export const PASSWORD_ALGORITHM = 'pbkdf2_sha256'
/** OWASP's current floor for PBKDF2-SHA256. */
export const PBKDF2_ITERATIONS = 310_000
const KEY_BYTES = 32
const SALT_BYTES = 16

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    KEY_BYTES * 8,
  )
  return new Uint8Array(bits)
}

interface ParsedHash {
  salt: Uint8Array
  hash: Uint8Array
  iterations: number
}

function parse(stored: string): ParsedHash | null {
  const parts = stored.split('$')
  if (parts.length !== 4) return null

  const [algorithm, rawIterations, rawSalt, rawHash] = parts as [string, string, string, string]
  if (algorithm !== PASSWORD_ALGORITHM) return null

  const iterations = Number.parseInt(rawIterations, 10)
  if (!Number.isSafeInteger(iterations) || iterations < 1) return null

  try {
    return { salt: base64Decode(rawSalt), hash: base64Decode(rawHash), iterations }
  } catch {
    return null
  }
}

export async function hashPassword(
  password: string,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derive(password, salt, iterations)
  return `${PASSWORD_ALGORITHM}$${iterations}$${base64Encode(salt)}$${base64Encode(hash)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parse(stored)
  if (parsed === null) return false
  if (parsed.salt.length !== SALT_BYTES || parsed.hash.length !== KEY_BYTES) return false
  const candidate = await derive(password, parsed.salt, parsed.iterations)
  return timingSafeEqual(candidate, parsed.hash)
}

/**
 * The stored string carries its own iteration count, so the cost can be raised
 * later without invalidating existing hashes. A successful login against a
 * below-current hash should re-hash at the new cost.
 */
export function needsRehash(stored: string): boolean {
  const parsed = parse(stored)
  return parsed === null || parsed.iterations < PBKDF2_ITERATIONS
}
