import { Module } from '@nestjs/common'
import { WhatsappAccountsController } from './whatsapp-accounts.controller'
import { WhatsappAccountsService } from './whatsapp-accounts.service'
import { InfrastructureModule } from '../infrastructure/infrastructure.module'

@Module({
  imports: [InfrastructureModule],
  controllers: [WhatsappAccountsController],
  providers: [WhatsappAccountsService],
  exports: [WhatsappAccountsService]
})
export class WhatsappAccountsModule {}
