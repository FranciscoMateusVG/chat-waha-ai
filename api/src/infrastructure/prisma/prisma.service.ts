import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/generated'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool
  private _client: InstanceType<typeof PrismaClient>

  constructor() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    this.pool = new Pool({ connectionString })
    const adapter = new PrismaPg(this.pool)

    // @ts-expect-error Prisma v7 adapter type mismatch
    this._client = new PrismaClient({ adapter })
  }

  get user() { return this._client.user }
  get session() { return this._client.session }
  get whatsappAccount() { return this._client.whatsappAccount }
  get chatHistory() { return this._client.chatHistory }
  get chatMessage() { return this._client.chatMessage }
  get knowledgeEntry() { return this._client.knowledgeEntry }
  get systemPrompt() { return this._client.systemPrompt }
  get notification() { return this._client.notification }
  get notificationBatch() { return this._client.notificationBatch }
  get notificationHistory() { return this._client.notificationHistory }
  get notificationStats() { return this._client.notificationStats }

  // Support both callback-style and array-style transactions
  $transaction<T>(arg: ((tx: InstanceType<typeof PrismaClient>) => Promise<T>) | any[]): Promise<T> {
    if (Array.isArray(arg)) {
      return this._client.$transaction(arg) as Promise<T>
    }
    return this._client.$transaction(arg) as Promise<T>
  }

  async onModuleInit() {
    await this._client.$connect()
    console.log('Prisma connected to PostgreSQL')
  }

  async onModuleDestroy() {
    await this._client.$disconnect()
    await this.pool.end()
    console.log('Prisma disconnected from PostgreSQL')
  }
}
