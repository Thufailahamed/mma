import { Hono } from 'hono'

/**
 * The Worker application. The full middleware chain and route tree are mounted
 * here as each slice lands.
 */
export const app = new Hono()

export default app
