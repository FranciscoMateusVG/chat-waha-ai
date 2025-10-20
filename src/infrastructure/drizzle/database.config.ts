import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schemas'

const Database = require('better-sqlite3')

export type ChatAIDatabase = BetterSQLite3Database<typeof schema>
export function createNotificationDatabase(): {
  db: ChatAIDatabase
  sqlite: any
} {
  const sqlite = new Database(
    process.env.NOTIFICATION_DB_PATH || './chat-ai-data.sqlite'
  )

  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL')

  const db = drizzle(sqlite, {
    schema
  })

  return { db, sqlite }
}
