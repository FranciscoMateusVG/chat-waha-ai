import { Module } from '@nestjs/common'
import { WhatsappAccountsController } from './whatsapp-accounts.controller'
import { WhatsappAccountsService } from './whatsapp-accounts.service'
import { WAHAModule } from '../infrastructure/waha/waha.module'

@Module({
  imports: [WAHAModule],
  controllers: [WhatsappAccountsController],
  providers: [WhatsappAccountsService],
  exports: [WhatsappAccountsService]
})
export class WhatsappAccountsModule {}
