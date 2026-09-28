const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function encode(bytes: Uint8Array, alphabet: string, pad: boolean): string {
  let output = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const byteA = bytes[index]!
    const byteB = bytes[index + 1]
    const byteC = bytes[index + 2]
    output += alphabet[byteA >> 2]
    output += alphabet[((byteA & 0x03) << 4) | ((byteB ?? 0) >> 4)]
    output += byteB === undefined ? (pad ? '=' : '') : alphabet[((byteB & 0x0f) << 2) | ((byteC ?? 0) >> 6)]
    output += byteC === undefined ? (pad ? '=' : '') : alphabet[byteC & 0x3f]
  }
  return output
}

function decode(value: string, alphabet: string): Uint8Array {
  const clean = value.replace(/=+$/, '')
  const bytes: number[] = []
  for (let index = 0; index < clean.length; index += 4) {
    const chunk = [0, 1, 2, 3].map((offset) => {
      const char = clean[index + offset]
      return char === undefined ? 0 : alphabet.indexOf(char)
    })
    const [a, b, c, d] = chunk as [number, number, number, number]
    bytes.push((a << 2) | (b >> 4))
    if (clean.length > index + 2) bytes.push(((b & 0x0f) << 4) | (c >> 2))
    if (clean.length > index + 3) bytes.push(((c & 0x03) << 6) | d)
  }
  return new Uint8Array(bytes)
}

/** Standard base64, with padding. Used for stored password hashes. */
export function base64Encode(bytes: Uint8Array): string {
  return encode(bytes, BASE64, true)
}

export function base64Decode(value: string): Uint8Array {
  return decode(value, BASE64)
}

/** URL-safe base64, never padded. Used for session and CSRF tokens. */
export function base64UrlEncode(bytes: Uint8Array): string {
  return encode(bytes, BASE64URL, false)
}

export function base64UrlDecode(value: string): Uint8Array {
  return decode(value, BASE64URL)
}

/**
 * Constant-time comparison over a fixed-length XOR accumulator. A length
 * mismatch returns immediately because a derived key's length is never secret.
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index]! ^ b[index]!
  }
  return difference === 0
}
