export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie')
  if (header === null) return undefined

  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator === -1) continue
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim())
    }
  }
  return undefined
}
