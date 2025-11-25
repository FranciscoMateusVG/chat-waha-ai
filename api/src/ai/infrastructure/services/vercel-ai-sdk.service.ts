import { openai } from '@ai-sdk/openai'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { generateText } from 'ai'
import { GetSystemPromptUseCase } from 'src/knowledge/application/use-cases/get-system-prompt.use-case'
import { AiToolRegistry } from '../tools/ai-tool-registry'
import { AiMessage, AiService } from './ai.service.interface'

@Injectable()
export class VercelAiSdkService implements AiService {
  private readonly logger = new Logger(VercelAiSdkService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly toolRegistry: AiToolRegistry,
    private readonly getSystemPromptUseCase: GetSystemPromptUseCase
  ) {}

  async generateResponse(context: AiMessage[]): Promise<string> {
    try {
      this.logger.debug(
        `Gerando resposta da IA com ${context.length} mensagens`
      )

      const apiKey = this.configService.get<string>('OPENAI_API_KEY')

      if (!apiKey) {
        throw new Error('OPENAI_API_KEY não configurada')
      }

      // Get system prompt from database
      const systemPromptResult = await this.getSystemPromptUseCase.execute()

      if (!systemPromptResult.success || !systemPromptResult.systemPrompt) {
        throw new Error('Não foi possível obter o prompt do sistema')
      }

      const systemPromptContent = systemPromptResult.systemPrompt.content

      this.logger.debug('Prompt do sistema carregado do banco de dados')

      // Use Vercel AI SDK with tools
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        messages: [
          {
            role: 'system',
            content: systemPromptContent
          },
          ...context.map((msg) => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        tools: this.toolRegistry.getTools(),
        maxSteps: 5,
        maxTokens: 500,
        temperature: 0.7
      })

      this.logger.debug('Resposta da IA gerada com sucesso')

      // Log tool usage
      if (result.steps && result.steps.length > 0) {
        this.logger.log(
          `IA usou ${result.steps.length} chamadas de ferramentas`
        )
        result.steps.forEach((step, i) => {
          this.logger.log(`Passo ${i + 1}: ${step.toolCalls.join(', ')}`)
        })
      }

      return result.text.trim()
    } catch (error) {
      this.logger.error(
        `Falha ao gerar resposta da IA: ${error.message}`,
        error.stack
      )
      throw new Error(`Geração da IA falhou: ${error.message}`)
    }
  }
}
