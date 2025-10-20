import { SystemPrompt } from '../entities/system-prompt.entity'

export interface SystemPromptRepository {
  save(prompt: SystemPrompt): Promise<void>
  get(): Promise<SystemPrompt | null>
  delete(): Promise<void>
}
