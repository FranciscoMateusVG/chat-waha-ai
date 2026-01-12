import { SystemPrompt } from '../entities/system-prompt.entity'

export interface SystemPromptRepository {
  save(prompt: SystemPrompt): Promise<void>
  get(userId: string): Promise<SystemPrompt | null>
  delete(userId: string): Promise<void>
}
