# Chat AI

A standalone NestJS service that handles AI message processing and scheduling for chat applications.

## Overview

This service was extracted from the main backend application to provide dedicated AI chat processing capabilities. It includes:

- **Scheduler Service**: Processes unresponded messages every 10 minutes and cleans up old messages every 12 hours
- **AI Message Processor**: Determines message topics and generates AI responses using OpenAI
- **Database Manager**: Manages chat data storage using LMDB
- **WhatsApp Service**: Handles sending messages (placeholder for actual WhatsApp integration)

## Architecture

The service follows a modular NestJS architecture:

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Main application module
├── scheduler/              # Scheduler functionality
│   ├── scheduler.module.ts
│   ├── scheduler.service.ts
│   ├── services/           # Core services
│   ├── interfaces/         # TypeScript interfaces
│   └── constants/          # Configuration constants
└── whatsapp/              # WhatsApp integration
    ├── whatsapp.module.ts
    └── whatsapp.service.ts
```

## Features

### Automated Message Processing
- Runs every 10 minutes to process unresponded messages
- Determines message topics using AI
- Generates contextual responses
- Maintains conversation history

### Knowledge Management
- Loads topic-specific knowledge dynamically
- Accumulates knowledge across conversation topics
- Supports Portuguese language responses

### Database Cleanup
- Automatically removes old messages (older than 12 hours)
- Efficient LMDB storage with compression

## Environment Variables

- `PORT`: Service port (default: 3001)
- `LOG_LEVEL`: Logging level (default: info)
- `OPENAI_API_KEY`: OpenAI API key for AI processing

## Installation

```bash
npm install
```

## Usage

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## Configuration

The service uses several configuration constants in `src/scheduler/constants/topics.ts`:

- **Topic Keywords**: Defines keywords for different conversation topics
- **AI Configuration**: OpenAI model settings and token limits
- **Topic Determination**: System prompts for topic classification

## Dependencies

Key dependencies include:
- `@nestjs/schedule`: Cron job scheduling
- `@ai-sdk/openai`: OpenAI integration
- `lmdb`: Database storage
- `nestjs-pino`: Logging

## Migration Notes

This service was migrated from the main backend application with the following changes:
- Created standalone WhatsApp service (placeholder)
- Simplified knowledge base retrieval
- Maintained original scheduler functionality
- Added proper TypeScript types for AI SDK

## TODO

- [ ] Implement actual WhatsApp API integration
- [ ] Add comprehensive knowledge base
- [ ] Set up proper environment configuration
- [ ] Add unit tests
- [ ] Add health checks
- [ ] Configure proper error handling and retry logic