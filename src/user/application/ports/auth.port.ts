export interface AuthPort {
  registerUser(id: string, email: string, password: string): Promise<void>;
}
