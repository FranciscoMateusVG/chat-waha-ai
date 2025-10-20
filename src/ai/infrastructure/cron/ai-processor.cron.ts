import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ProcessOpenChatsWithAiUseCase } from '../../application/use-cases/process-open-chats-with-ai.use-case'

@Injectable()
export class AiProcessorCron {
  private readonly logger = new Logger(AiProcessorCron.name)
  private isProcessing = false

  constructor(
    private readonly processOpenChatsUseCase: ProcessOpenChatsWithAiUseCase
  ) {}
  //EVERY 5 MINUTES
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processChats(): Promise<void> {
    // Prevent overlapping executions
    if (this.isProcessing) {
      this.logger.warn('Previous execution still running, skipping this cycle')
      return
    }

    try {
      this.isProcessing = true
      this.logger.log('Starting scheduled AI chat processing')

      const result = await this.processOpenChatsUseCase.execute()

      // Log summary
      this.logger.log(
        `AI processing completed: ${result.totalProcessed} chats processed, ` +
          `${result.successful} successful, ${result.failed} failed`
      )

      // Log individual errors if any
      if (result.errors.length > 0) {
        this.logger.warn(`Errors encountered during processing:`)
        result.errors.forEach((error, index) => {
          this.logger.warn(`  ${index + 1}. ${error}`)
        })
      }

      // Log success message if no chats needed processing
      if (result.totalProcessed === 0) {
        this.logger.log('No chats needed AI response at this time')
      }
    } catch (error) {
      this.logger.error(
        `Critical error in AI processor cron job: ${error.message}`,
        error.stack
      )
      // Don't throw - cron should never crash
    } finally {
      this.isProcessing = false
    }
  }
}
