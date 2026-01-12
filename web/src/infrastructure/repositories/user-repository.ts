import { prisma } from "@/lib/db";
import { hashPassword } from "@/domain/user/password";
import type { User } from "@/domain/user/types";

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase().trim(),
      name: input.name.trim(),
      passwordHash,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function findUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function userExists(email: string): Promise<boolean> {
  const count = await prisma.user.count({
    where: { email: email.toLowerCase().trim() },
  });
  return count > 0;
}
