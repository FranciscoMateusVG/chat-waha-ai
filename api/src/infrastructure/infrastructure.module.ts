import { Module } from '@nestjs/common'

// This module is kept for backwards compatibility but is now empty
// since PrismaModule is globally imported in AppModule
@Module({
  providers: [],
  exports: []
})
export class InfrastructureModule {}
