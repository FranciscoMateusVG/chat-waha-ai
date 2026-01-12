import { Module, Global } from '@nestjs/common'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { SessionGuard } from './session.guard'
import { InfrastructureModule } from '../infrastructure/infrastructure.module'

@Global()
@Module({
  imports: [InfrastructureModule],
  controllers: [AuthController],
  providers: [AuthGuard, AuthService, SessionGuard],
  exports: [AuthGuard, AuthService, SessionGuard]
})
export class AuthModule {}
