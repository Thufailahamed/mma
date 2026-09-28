import type { Metadata } from 'next'

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
export const siteName = 'CAGE'

export interface SeoInput {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  publishedTime?: string
  images?: string[]
}

export function buildMetadata(input: SeoInput): Metadata {
  const canonical = `${siteUrl}${input.path}`

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      type: input.type ?? 'website',
      url: canonical,
      siteName,
      title: input.title,
      description: input.description,
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.images ? { images: input.images } : {}),
    },
    twitter: {
      card: input.images ? 'summary_large_image' : 'summary',
      title: input.title,
      description: input.description,
    },
  }
}
