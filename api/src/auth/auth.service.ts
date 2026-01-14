import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { randomUUID, createHash } from 'crypto'
import { PrismaService } from '../infrastructure/prisma/prisma.service'

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex')
  }

  private generateToken(): string {
    return randomUUID() + randomUUID().replace(/-/g, '')
  }

  async register(email: string, password: string, name?: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    if (existingUser) {
      throw new ConflictException('Email já cadastrado')
    }

    const userId = randomUUID()
    const now = new Date()
    const passwordHash = this.hashPassword(password)

    // Create user
    const user = await this.prisma.user.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        name,
        createdAt: now,
        updatedAt: now
      }
    })

    // Create session
    const token = this.generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await this.prisma.session.create({
      data: {
        id: randomUUID(),
        userId,
        token,
        expiresAt,
        createdAt: now
      }
    })

    return { user, token }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos')
    }

    const passwordHash = this.hashPassword(password)
    if (user.passwordHash !== passwordHash) {
      throw new UnauthorizedException('Email ou senha inválidos')
    }

    // Create new session
    const token = this.generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const now = new Date()

    await this.prisma.session.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        token,
        expiresAt,
        createdAt: now
      }
    })

    return { user, token }
  }

  async logout(token: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { token }
    })
  }

  async validateSession(token: string) {
    const now = new Date()

    const session = await this.prisma.session.findFirst({
      where: {
        token,
        expiresAt: { gt: now }
      }
    })

    if (!session) {
      return null
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId }
    })
    return user || null
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    })
    return user || null
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date()
    await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: now } }
    })
  }
}
