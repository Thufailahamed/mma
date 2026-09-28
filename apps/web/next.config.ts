import type { NextConfig } from 'next'

const apiOrigin = process.env.API_ORIGIN ?? 'https://localhost:8787'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
  rewrites() {
    // The browser only ever talks to the Next origin, so the session cookie is
    // same-origin in development and production alike and CORS is never needed.
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }]
  },
}

export default nextConfig
