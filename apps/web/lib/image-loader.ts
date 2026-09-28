import type { ImageLoaderProps } from 'next/image'

const ALLOWED_WIDTHS = new Set([64, 128, 256, 384, 512, 768, 1024, 1536, 2048])

/**
 * R2 objects are never exposed as raw URLs. Every image resolves through the
 * API's /img route, which consults media_assets before streaming from R2.
 */
export default function mmaImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (src.startsWith('http')) return src
  const safeWidth = ALLOWED_WIDTHS.has(width) ? width : 1024
  const params = new URLSearchParams({ w: String(safeWidth), f: 'auto' })
  if (quality !== undefined) params.set('q', String(quality))
  return `/img/${src.replace(/^\/+/, '')}?${params.toString()}`
}
