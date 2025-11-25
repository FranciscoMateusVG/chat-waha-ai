import { Module } from '@nestjs/common'
import { DrizzleDatabaseService } from './drizzle/database.provider'

@Module({
  providers: [DrizzleDatabaseService],
  exports: [DrizzleDatabaseService]
})
export class InfrastructureModule {}
