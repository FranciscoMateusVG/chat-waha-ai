import type { Config } from 'drizzle-kit'

export default {
  schema: './src/infrastructure/drizzle/schemas/index.ts',
  out: './src/infrastructure/drizzle/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: process.env.NOTIFICATION_DB_PATH || './notification-data.sqlite'
  }
} satisfies Config
