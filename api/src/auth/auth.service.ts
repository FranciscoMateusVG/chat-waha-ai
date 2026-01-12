import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { eq, and, gt, lt } from 'drizzle-orm'
import { randomUUID, createHash } from 'crypto'
import { DrizzleDatabaseService } from '../infrastructure/drizzle/database.provider'
import { users, sessions, type User, type Session } from '../infrastructure/drizzle/schemas'

@Injectable()
export class AuthService {
  constructor(private readonly dbService: DrizzleDatabaseService) {}

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex')
  }

  private generateToken(): string {
    return randomUUID() + randomUUID().replace(/-/g, '')
  }

  async register(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
    const db = this.dbService.getDatabase()

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get()
    if (existingUser) {
      throw new ConflictException('Email já cadastrado')
    }

    const userId = randomUUID()
    const now = new Date()
    const passwordHash = this.hashPassword(password)

    // Create user
    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      name,
      createdAt: now,
      updatedAt: now
    })

    // Create session
    const token = this.generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.insert(sessions).values({
      id: randomUUID(),
      userId,
      token,
      expiresAt,
      createdAt: now
    })

    const user = await db.select().from(users).where(eq(users.id, userId)).get()
    return { user: user!, token }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const db = this.dbService.getDatabase()

    const user = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get()
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

    await db.insert(sessions).values({
      id: randomUUID(),
      userId: user.id,
      token,
      expiresAt,
      createdAt: now
    })

    return { user, token }
  }

  async logout(token: string): Promise<void> {
    const db = this.dbService.getDatabase()
    await db.delete(sessions).where(eq(sessions.token, token))
  }

  async validateSession(token: string): Promise<User | null> {
    const db = this.dbService.getDatabase()
    const now = new Date()

    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
      .get()

    if (!session) {
      return null
    }

    const user = await db.select().from(users).where(eq(users.id, session.userId)).get()
    return user || null
  }

  async getUserById(userId: string): Promise<User | null> {
    const db = this.dbService.getDatabase()
    const user = await db.select().from(users).where(eq(users.id, userId)).get()
    return user || null
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    const db = this.dbService.getDatabase()
    const now = new Date()
    await db.delete(sessions).where(lt(sessions.expiresAt, now))
  }
}
