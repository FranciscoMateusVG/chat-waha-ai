import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { WhatsAppClientService } from './waha-client.service'
import { WAHASessionService } from './waha-session.service'

@Module({
  imports: [ConfigModule],
  providers: [WhatsAppClientService, WAHASessionService],
  exports: [WhatsAppClientService, WAHASessionService]
})
export class WAHAModule {}
