import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as dotenv from 'dotenv'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'

// Load environment variables from .env file
dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.useLogger(app.get(Logger))
  app.enableShutdownHooks()

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Chat AI Notifications API')
    .setDescription('API for managing notifications via email and WhatsApp')
    .setVersion('1.0')
    .addTag('notifications')
    .addTag('AI Testing')
    .addTag('Knowledge')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key'
      },
      'Bearer'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header'
      },
      'ApiKey'
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  const port = process.env.NOTIFICATION_PORT || 3000

  // Graceful shutdown handling
  const server = await app.listen(port)

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...')
    await app.close()
    server.close()
  })

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...')
    await app.close()
    server.close()
  })

  console.log(`Chat AI service running on port ${port}`)
  console.log(`Swagger documentation available at http://localhost:${port}/api`)
}
bootstrap()
