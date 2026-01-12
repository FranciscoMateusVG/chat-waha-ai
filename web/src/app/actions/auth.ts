"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth/session";
import { verifyPassword } from "@/domain/user/password";
import { createUser, findUserByEmail, userExists } from "@/infrastructure/repositories/user-repository";

export interface AuthState {
  error?: string;
  success?: boolean;
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "E-mail e senha são obrigatórios" };
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return { error: "Credenciais inválidas" };
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return { error: "Credenciais inválidas" };
  }

  await createSession(user.id);

  redirect("/dashboard");
}

export async function register(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !name || !password) {
    return { error: "Todos os campos são obrigatórios" };
  }

  if (password.length < 8) {
    return { error: "A senha deve ter pelo menos 8 caracteres" };
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "E-mail inválido" };
  }

  const exists = await userExists(email);
  if (exists) {
    return { error: "Este e-mail já está cadastrado" };
  }

  const user = await createUser({ email, name, password });
  await createSession(user.id);

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
