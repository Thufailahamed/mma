import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema/index.ts',
  out: '../../database/migrations',
  strict: true,
  verbose: true,
})
