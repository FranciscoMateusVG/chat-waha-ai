import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../infrastructure/prisma/prisma.service'

@Injectable()
export class WhatsappAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.whatsappAccount.findMany({
      where: { userId }
    })
  }

  // Used by webhook to look up userId from session (session = account id)
  async findUserIdBySession(session: string): Promise<string | null> {
    const account = await this.prisma.whatsappAccount.findUnique({
      where: { id: session },
      select: { userId: true }
    })

    return account?.userId || null
  }

  async findById(id: string, userId: string) {
    const account = await this.prisma.whatsappAccount.findUnique({
      where: { id }
    })

    if (!account) {
      throw new NotFoundException('Conta WhatsApp não encontrada')
    }

    // User isolation check
    if (account.userId !== userId) {
      throw new ForbiddenException('Acesso negado')
    }

    return account
  }

  async create(userId: string, name: string, phoneNumber?: string) {
    const now = new Date()
    const id = randomUUID()

    return this.prisma.whatsappAccount.create({
      data: {
        id,
        userId,
        name,
        phoneNumber: phoneNumber || null,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      }
    })
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; phoneNumber?: string; status?: string }
  ) {
    // First verify ownership
    await this.findById(id, userId)

    const now = new Date()
    return this.prisma.whatsappAccount.update({
      where: { id },
      data: {
        ...data,
        updatedAt: now
      }
    })
  }

  async delete(id: string, userId: string): Promise<void> {
    // First verify ownership
    await this.findById(id, userId)

    await this.prisma.whatsappAccount.delete({
      where: { id }
    })
  }
}
