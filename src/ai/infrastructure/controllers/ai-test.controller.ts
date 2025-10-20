import { Body, Controller, Inject, Logger, Post } from '@nestjs/common'
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import { AI_SERVICE } from '../../tokens'
import { AiMessage, AiService } from '../services/ai.service.interface'

class AiMessageDto {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: ['user', 'assistant', 'system'],
    example: 'user'
  })
  role: 'user' | 'assistant' | 'system'

  @ApiProperty({
    description: 'Content of the message',
    example: 'Olá, qual é o horário da aula de matemática?'
  })
  content: string
}

class GenerateResponseDto {
  @ApiProperty({
    description: 'Array of messages for conversation context',
    type: [AiMessageDto],
    example: [
      {
        role: 'user',
        content: 'Olá, qual é o horário da aula de matemática?'
      }
    ]
  })
  context: AiMessage[]
}

class GenerateSimpleResponseDto {
  @ApiProperty({
    description: 'Simple user message to send to AI',
    example: 'Olá, como posso me matricular?'
  })
  message: string
}

@ApiTags('AI Testing')
@Controller('ai/test')
export class AiTestController {
  private readonly logger = new Logger(AiTestController.name)

  constructor(
    @Inject(AI_SERVICE)
    private readonly aiService: AiService
  ) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate AI response with full context',
    description:
      'Send a complete conversation context with multiple messages to the AI service. ' +
      'The AI will use the Vercel AI SDK with OpenAI GPT-4o-mini and can call available tools.'
  })
  @ApiResponse({
    status: 200,
    description: 'AI response generated successfully',
    schema: {
      example: {
        success: true,
        response: 'A aula de matemática é às 14h.',
        contextLength: 1
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Error generating AI response',
    schema: {
      example: {
        success: false,
        error: 'Error message here'
      }
    }
  })
  async generateResponse(@Body() dto: GenerateResponseDto) {
    try {
      this.logger.log(
        `Recebida requisição de teste com ${dto.context.length} mensagens`
      )

      const response = await this.aiService.generateResponse(dto.context)

      return {
        success: true,
        response,
        contextLength: dto.context.length
      }
    } catch (error) {
      this.logger.error(`Erro ao gerar resposta: ${error.message}`, error.stack)
      return {
        success: false,
        error: error.message
      }
    }
  }

  @Post('generate-simple')
  @ApiOperation({
    summary: 'Generate AI response from simple message',
    description:
      'Send a single message to the AI service. This is a simplified endpoint that ' +
      'automatically creates the context with just your message. Perfect for quick testing.'
  })
  @ApiResponse({
    status: 200,
    description: 'AI response generated successfully',
    schema: {
      example: {
        success: true,
        response:
          'Para se matricular, você precisa acessar o portal do aluno...',
        userMessage: 'Olá, como posso me matricular?'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Error generating AI response',
    schema: {
      example: {
        success: false,
        error: 'Error message here'
      }
    }
  })
  async generateSimpleResponse(@Body() body: GenerateSimpleResponseDto) {
    try {
      this.logger.log(`Recebida requisição simples: ${body.message}`)

      const context: AiMessage[] = [
        {
          role: 'user',
          content: body.message
        }
      ]

      const response = await this.aiService.generateResponse(context)

      return {
        success: true,
        response,
        userMessage: body.message
      }
    } catch (error) {
      this.logger.error(`Erro ao gerar resposta: ${error.message}`, error.stack)
      return {
        success: false,
        error: error.message
      }
    }
  }
}
