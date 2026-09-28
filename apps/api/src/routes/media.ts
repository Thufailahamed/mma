import { createDb } from '@mma/db'
import { mediaAssets } from '@mma/db/schema'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { AppError } from '@mma/shared'
import { imageQuerySchema, parseOrThrow } from '@mma/validation'
import type { Env } from '../env'

type MediaEnv = { Bindings: Env }

/** Only these widths are pre-generated, so arbitrary resizes stay off the hot path. */
const ALLOWED_WIDTHS = new Set([64, 128, 256, 384, 512, 768, 1024, 1536, 2048])
const CACHE_CONTROL = 'public, max-age=31536000, immutable'

type ImageTransformInit = {
  cf: { image: { width?: number; format?: string; quality?: number } }
}

/**
 * workers-types does not yet model the R2 image-transform overload, which
 * Cloudflare documents as fetch(r2ObjectBody, { cf: { image } }). The cast is
 * confined to this one call rather than loosening the module.
 */
const fetchWithImageTransform = fetch as unknown as (
  input: ReadableStream,
  init: ImageTransformInit,
) => Promise<Response>

export function createMediaRoutes() {
  const routes = new Hono<MediaEnv>()

  routes.get('/:key{.+}', async (c) => {
    const key = c.req.param('key')
    if (key.includes('..') || key.startsWith('/')) {
      throw AppError.notFound('No such asset.')
    }

    const { w, f, q } = parseOrThrow(imageQuerySchema, c.req.query())
    if (w !== undefined && !ALLOWED_WIDTHS.has(w)) {
      throw AppError.validation('Unsupported image width.', [
        { path: 'w', message: 'Use an allow-listed width.' },
      ])
    }

    // media_assets is the source of truth. An R2 key alone is not authority to
    // serve, and raw R2 URLs are never exposed to the client.
    const asset = await createDb(c.env)
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.objectKey, key))
      .get()

    if (asset === undefined) throw AppError.notFound('No such asset.')

    const object = await c.env.MEDIA.get(key)
    if (object === null) throw AppError.notFound('No such asset.')

    // R2 image transforms run on the outbound fetch, not on get() options.
    let body: ReadableStream = object.body
    let contentType = object.httpMetadata?.contentType ?? asset.contentType

    if (w !== undefined || f !== undefined) {
      const transformed = await fetchWithImageTransform(object.body, {
        cf: {
          image: {
            ...(w === undefined ? {} : { width: w }),
            ...(f === undefined ? {} : { format: f }),
            ...(q === undefined ? {} : { quality: q }),
          },
        },
      })
      if (transformed.body !== null) body = transformed.body
      contentType = transformed.headers.get('content-type') ?? contentType
    }

    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': CACHE_CONTROL,
        ETag: `"${asset.objectKey}"`,
      },
    })
  })

  return routes
}
