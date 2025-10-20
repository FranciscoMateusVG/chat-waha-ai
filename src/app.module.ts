import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { APP_GUARD } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'
import { AiModule } from './ai/ai.module'
import { AuthModule } from './auth/auth.module'
import { AuthGuard } from './auth/auth.guard'
import { ChatHistoryModule } from './chatHistory/chatHistory.module'
import { NotificationsModule } from './notifications/notifications.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production'

        const baseConfig = {
          level: 'debug',
          autoLogging: false
        }

        if (isProduction) {
          return {
            pinoHttp: {
              level: 'info',
              autoLogging: false,
              redact: [
                'req.headers.authorization',
                'headers.authorization',
                'response.headers["set-cookie"]',
                'req.body.password',
                'req.body.token',
                '*.password',
                '*.token'
              ],

              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: false,
                  singleLine: true
                }
              }
            }
          }
        }

        // Development configuration with pretty printing
        return {
          pinoHttp: {
            ...baseConfig,

            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true
              }
            }
          }
        }
      },
      inject: [ConfigService]
    }),
    ChatHistoryModule,
    NotificationsModule,
    AiModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ]
})
export class AppModule {}
