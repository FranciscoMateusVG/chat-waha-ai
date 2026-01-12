import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { DrizzleDatabaseService } from '../infrastructure/drizzle/database.provider'
import { whatsappAccounts, type WhatsappAccount } from '../infrastructure/drizzle/schemas'

@Injectable()
export class WhatsappAccountsService {
  constructor(private readonly dbService: DrizzleDatabaseService) {}

  async findAllByUser(userId: string): Promise<WhatsappAccount[]> {
    const db = this.dbService.getDatabase()
    return db.select().from(whatsappAccounts).where(eq(whatsappAccounts.userId, userId)).all()
  }

  // Used by webhook to look up userId from session (session = account id)
  async findUserIdBySession(session: string): Promise<string | null> {
    const db = this.dbService.getDatabase()
    const account = await db
      .select({ userId: whatsappAccounts.userId })
      .from(whatsappAccounts)
      .where(eq(whatsappAccounts.id, session))
      .get()

    return account?.userId || null
  }

  async findById(id: string, userId: string): Promise<WhatsappAccount> {
    const db = this.dbService.getDatabase()
    const account = await db
      .select()
      .from(whatsappAccounts)
      .where(eq(whatsappAccounts.id, id))
      .get()

    if (!account) {
      throw new NotFoundException('Conta WhatsApp não encontrada')
    }

    // User isolation check
    if (account.userId !== userId) {
      throw new ForbiddenException('Acesso negado')
    }

    return account
  }

  async create(userId: string, name: string, phoneNumber?: string): Promise<WhatsappAccount> {
    const db = this.dbService.getDatabase()
    const now = new Date()
    const id = randomUUID()

    await db.insert(whatsappAccounts).values({
      id,
      userId,
      name,
      phoneNumber: phoneNumber || null,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    })

    const account = await db.select().from(whatsappAccounts).where(eq(whatsappAccounts.id, id)).get()
    return account!
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; phoneNumber?: string; status?: string }
  ): Promise<WhatsappAccount> {
    const db = this.dbService.getDatabase()

    // First verify ownership
    await this.findById(id, userId)

    const now = new Date()
    await db
      .update(whatsappAccounts)
      .set({
        ...data,
        updatedAt: now
      })
      .where(and(eq(whatsappAccounts.id, id), eq(whatsappAccounts.userId, userId)))

    return this.findById(id, userId)
  }

  async delete(id: string, userId: string): Promise<void> {
    const db = this.dbService.getDatabase()

    // First verify ownership
    await this.findById(id, userId)

    await db
      .delete(whatsappAccounts)
      .where(and(eq(whatsappAccounts.id, id), eq(whatsappAccounts.userId, userId)))
  }
}
