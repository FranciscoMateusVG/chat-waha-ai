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
        migrationsFolder: './src/infrastructure/drizzle/migrations'
      })
      console.log('Database migrations completed successfully')
    } catch (error) {
      console.error('Migration failed:', error)
      // Don't throw error to allow app to continue if tables already exist
      console.log('Continuing with existing database schema...')
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
