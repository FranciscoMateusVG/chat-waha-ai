import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { LoggerModule } from 'nestjs-pino'
import { AiModule } from './ai/ai.module'
import { ChatHistoryModule } from './chatHistory/chatHistory.module'
import { NotificationsModule } from './notifications/notifications.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
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
  ]
})
export class AppModule {}
