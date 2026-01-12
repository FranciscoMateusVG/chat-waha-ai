import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ChatHistoryRepository } from '../domain/repositories/chat-history.repository'
import { CHAT_HISTORY_REPOSITORY } from '../tokens'

@Injectable()
export class SchedulerController {
  private readonly logger = new Logger(SchedulerController.name)

  constructor(
    @Inject(CHAT_HISTORY_REPOSITORY)
    private readonly chatHistoryRepository: ChatHistoryRepository
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleChatHistoryCleanup(): Promise<void> {
    this.logger.log('Starting chat history cleanup job')

    try {
      // Use system method that finds all open chat histories across all users
      const openChatHistories = await this.chatHistoryRepository.findAllOpenChatHistoriesAcrossAllUsers()
      this.logger.log(`Found ${openChatHistories.length} open chat histories`)

      let closedCount = 0

      for (const chatHistory of openChatHistories) {
        if (chatHistory.shouldBeClosed()) {
          chatHistory.closeChat()
          await this.chatHistoryRepository.save(chatHistory)
          closedCount++
          this.logger.debug(`Closed chat history: ${chatHistory.getId().value}`)
        }
      }

      this.logger.log(`Chat history cleanup completed. Closed ${closedCount} chat histories`)
    } catch (error) {
      this.logger.error('Error during chat history cleanup', error.stack)
    }
  }
}