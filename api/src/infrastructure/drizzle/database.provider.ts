import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { ChatAIDatabase, createNotificationDatabase } from './database.config'

@Injectable()
export class DrizzleDatabaseService implements OnModuleInit, OnModuleDestroy {
  private dbInstance: { db: ChatAIDatabase; sqlite: any } | null = null

  constructor() {
    // Initialize database synchronously in constructor
    this.dbInstance = createNotificationDatabase()
  }

  async onModuleInit() {
    // Run migrations on startup
    try {
      await migrate(this.dbInstance!.db, {
        migrationsFolder: '/app/src/infrastructure/drizzle/migrations'
      })
      console.log('Database migrations completed successfully')
    } catch (error) {
      console.error('Migration failed:', error)
      // Don't throw error to allow app to continue if tables already exist
      console.log('Continuing with existing database schema...')
    }

    // Ensure auth tables exist (fallback for fresh databases)
    this.ensureAuthTables()
  }

  private ensureAuthTables() {
    try {
      const sqlite = this.dbInstance!.sqlite

      // Create users table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id text PRIMARY KEY NOT NULL,
          email text NOT NULL UNIQUE,
          password_hash text NOT NULL,
          name text,
          created_at integer DEFAULT (unixepoch()) NOT NULL,
          updated_at integer DEFAULT (unixepoch()) NOT NULL
        )
      `)
      sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`)

      // Create sessions table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id text PRIMARY KEY NOT NULL,
          user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token text NOT NULL UNIQUE,
          expires_at integer NOT NULL,
          created_at integer DEFAULT (unixepoch()) NOT NULL
        )
      `)
      sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token)`)
      sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)`)

      // Create whatsapp_accounts table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS whatsapp_accounts (
          id text PRIMARY KEY NOT NULL,
          user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name text NOT NULL,
          phone_number text,
          status text DEFAULT 'pending' NOT NULL,
          created_at integer DEFAULT (unixepoch()) NOT NULL,
          updated_at integer DEFAULT (unixepoch()) NOT NULL
        )
      `)
      sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_user_id ON whatsapp_accounts (user_id)`)

      console.log('Auth tables ensured')
    } catch (error) {
      console.error('Failed to ensure auth tables:', error)
    }
  }

  async onModuleDestroy() {
    if (this.dbInstance?.sqlite) {
      this.dbInstance.sqlite.close()
    }
  }

  getDatabase(): ChatAIDatabase {
    if (!this.dbInstance) {
      throw new Error('Database not initialized')
    }
    return this.dbInstance.db
  }
}
