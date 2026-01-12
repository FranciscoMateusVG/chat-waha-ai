import { Module } from '@nestjs/common'
import { WhatsappAccountsController } from './whatsapp-accounts.controller'
import { WhatsappAccountsService } from './whatsapp-accounts.service'

@Module({
  controllers: [WhatsappAccountsController],
  providers: [WhatsappAccountsService],
  exports: [WhatsappAccountsService]
})
export class WhatsappAccountsModule {}
