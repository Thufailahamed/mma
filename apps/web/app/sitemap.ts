import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'

/** Valid but minimal in Phase 1. Entity routes are appended in Phases 2 and 3. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: 'hourly', priority: 1 },
    { url: `${siteUrl}/login`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/register`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
