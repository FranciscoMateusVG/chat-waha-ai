# AI Orchestration Layer

## Overview

The AI layer is an **orchestration/application service layer** that coordinates between existing domains (ChatHistory, Knowledge, and Notification) to provide automated AI-powered responses to customer inquiries via WhatsApp.

**Important:** This is NOT a domain - it's a service layer that orchestrates business logic across multiple domains.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         AI Layer (Orchestration - NOT a Domain)              │
│                                                              │
│  ProcessOpenChatsWithAiUseCase (Main Orchestrator)          │
│    1. Find open chats needing AI response                   │
│    2. Get chat history for context                          │
│    3. Call AI with tools enabled                            │
│       ↓ AI decides to use tools (fetch knowledge)           │
│       ↓ Execute tool functions                              │
│       ↓ Feed results back to AI                             │
│    4. AI generates final response with knowledge            │
│    5. Save AI response to chat                              │
│    6. Send notification via WhatsApp                        │
│                                                              │
│  [Triggered by Cron Job every 1 minute]                     │
└─────────────────────────────────────────────────────────────┘
         ↓                ↓                    ↓
    Chat History     Knowledge            Notification
      Domain          Domain                Domain
```

## Project Structure

```
src/ai/
├── ai.module.ts                              # Module configuration
├── tokens.ts                                 # DI tokens
│
├── application/
│   └── use-cases/
│       └── process-open-chats-with-ai.use-case.ts  # Main orchestrator
│
└── infrastructure/
    ├── services/
    │   ├── ai.service.interface.ts           # AI service contract
    │   └── vercel-ai-sdk.service.ts          # Vercel AI SDK implementation
    │
    ├── tools/
    │   └── ai-tool-registry.ts               # AI tool definitions
    │
    └── cron/
        └── ai-processor.cron.ts              # Background scheduler
```

## Components

### 1. AI Service (`ai.service.interface.ts`)

Defines the contract for AI services:

```typescript
interface AiService {
  generateResponse(context: AiMessage[]): Promise<string>
}
```

### 2. Vercel AI SDK Service (`vercel-ai-sdk.service.ts`)

Implements the AI service using Vercel AI SDK with OpenAI:

- **Model:** gpt-4o-mini (fast and cost-effective)
- **Features:** Tool calling, streaming support
- **Configuration:**
  - `maxSteps: 5` - Allow up to 5 tool call rounds
  - `maxTokens: 500` - Keep responses concise
  - `temperature: 0.7` - Balanced creativity

**System Prompt:**

- Friendly customer service assistant
- Always use tools to fetch information
- Keep responses brief (2-3 sentences)
- Respond in the same language as customer

### 3. AI Tool Registry (`ai-tool-registry.ts`)

Registers three tools for the AI to use:

#### a. `fetchGeneralInfo`

- **Purpose:** Get general information about Papaya Pay services
- **Parameters:** `{ topic: string }`
- **Implementation:** Calls `knowledgeRepository.findByKey(\`general:\${topic}\`)`

#### b. `fetchUserInfo`

- **Purpose:** Get user-specific information
- **Parameters:** `{ userId: string }`
- **Implementation:** Calls `knowledgeRepository.findByKey(\`user:\${userId}\`)`

#### c. `searchKnowledge`

- **Purpose:** Search the knowledge base
- **Parameters:** `{ query: string }`
- **Implementation:** Calls `knowledgeRepository.search(query)`

### 4. Process Open Chats Use Case (`process-open-chats-with-ai.use-case.ts`)

Main orchestrator that:

1. **Finds open chats:** `chatHistoryRepo.findAllOpenChatHistories()`
2. **Filters chats needing response:** `chat.needsAiResponse() === true`
3. **Processes each chat:**
   - Builds AI context from message history
   - Calls AI service (AI uses tools automatically)
   - Adds AI response to chat
   - Saves updated chat
   - Sends WhatsApp notification
4. **Returns results:**
   - Total processed
   - Successful
   - Failed
   - Error messages

**Error Handling:**

- Each chat processed independently
- Failures don't affect other chats
- Notification errors are logged but not critical

### 5. AI Processor Cron (`ai-processor.cron.ts`)

Background job that runs every minute:

- Calls `ProcessOpenChatsWithAiUseCase`
- Logs execution results
- Prevents overlapping executions
- Never crashes (all errors caught)

## Configuration

### Environment Variables

Required in `.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Module Setup

The AI module is configured in `ai.module.ts` with:

- **Imports:**

  - `ScheduleModule.forRoot()` - Cron support
  - `ConfigModule` - Environment variables
  - `ChatHistoryModule` - Chat domain
  - `KnowledgeModule` - Knowledge domain
  - `NotificationsModule` - Notification domain

- **Providers:**

  - `AiToolRegistry` - Tool functions
  - `AI_SERVICE` (VercelAiSdkService) - AI implementation
  - `ProcessOpenChatsWithAiUseCase` - Main use case
  - `AiProcessorCron` - Cron job

- **Exports:**
  - `ProcessOpenChatsWithAiUseCase` - For manual triggers

## Flow Example

```
[Cron triggers every minute]
         ↓
[AiProcessorCron.processChats()]
         ↓
[ProcessOpenChatsWithAiUseCase.execute()]
         ↓
[Find 2 chats needing response]
         ↓
[Process Chat #1]
   ↓
[Build context: User asks "What payment methods do you support?"]
   ↓
[Call aiService.generateResponse(context)]
   ↓
[AI analyzes question → decides to use fetchGeneralInfo]
   ↓
[Tool executes: knowledgeRepo.findByKey("general:payment-methods")]
   ↓
[Tool returns: "We support credit cards, PIX, bank transfers..."]
   ↓
[AI generates response: "We support credit cards, PIX, and bank transfers!"]
   ↓
[chat.addAiMessage(response)]
   ↓
[chatHistoryRepo.save(chat)]
   ↓
[sendNotificationUseCase.sendIndividual() via WhatsApp]
   ↓
[Success! Move to Chat #2]
```

## Testing Strategy

### Manual Testing

1. Create test chat with user message
2. Wait for cron execution (every minute)
3. Verify AI response in chat history
4. Check WhatsApp notification delivery
5. Review logs for tool usage

### Monitoring

- Check logs for each execution
- Monitor tool call frequency
- Track success/failure rates
- Watch OpenAI API usage

## Dependencies

### External Packages

- `ai` - Vercel AI SDK
- `@ai-sdk/openai` - OpenAI provider
- `zod` - Schema validation
- `@nestjs/schedule` - Cron jobs
- `@nestjs/config` - Environment variables

### Internal Dependencies

- `ChatHistoryModule` → `ChatHistoryRepository`
- `KnowledgeModule` → `KnowledgeRepository`
- `NotificationsModule` → `SendNotificationUseCase`

## Best Practices Implemented

1. **Separation of Concerns:** AI layer only orchestrates, doesn't contain business logic
2. **Dependency Injection:** All dependencies injected via constructor
3. **Error Handling:** Graceful error handling with logging
4. **Type Safety:** Strong typing throughout
5. **Logging:** Comprehensive logging at every step
6. **Modularity:** Easy to swap AI provider
7. **Testability:** Dependencies can be mocked

## Potential Improvements

### Short Term

- Add unit tests for use case
- Add integration tests for AI service
- Implement retry logic for failed AI calls
- Add metrics/monitoring

### Long Term

- Implement conversation memory (beyond message history)
- Add support for multi-turn conversations
- Implement rate limiting for AI calls
- Add A/B testing for different prompts
- Support multiple languages explicitly
- Add caching for common queries

## Troubleshooting

### Common Issues

**1. AI not responding to chats**

- Check `OPENAI_API_KEY` is set
- Verify chat status is "open"
- Check `chat.needsAiResponse()` returns true
- Review cron job logs

**2. Tool calls not working**

- Verify knowledge entries exist
- Check tool descriptions are clear
- Review `result.steps` in logs
- Ensure Zod schemas are valid

**3. Notifications not sent**

- Check WhatsApp service is running
- Verify contact info is valid
- Review notification error logs
- Note: Notification errors don't fail AI response

**4. High OpenAI costs**

- Monitor `maxTokens` setting
- Check tool call frequency
- Review conversation length
- Consider using cache for common queries

## API Cost Considerations

**Current Configuration:**

- Model: gpt-4o-mini (very cost-effective)
- Max tokens: 500 per response
- Max steps: 5 tool calls per response

**Estimated Costs** (as of 2024):

- Input: ~$0.00015 per request (avg 1000 tokens)
- Output: ~$0.00015 per response (500 tokens)
- Tool calls: ~$0.00005 per tool call
- **Total:** ~$0.0004 per chat response

**Cost Optimization:**

- Cache common knowledge queries
- Reduce max token limit if possible
- Monitor and limit tool call frequency
- Consider batching similar requests

## Security Considerations

1. **API Key Security:**

   - Store in environment variables
   - Never commit to version control
   - Rotate regularly

2. **Data Privacy:**

   - Don't log sensitive user data
   - Comply with GDPR/privacy regulations
   - Anonymize user info in logs

3. **Rate Limiting:**
   - Monitor OpenAI API usage
   - Implement application-level rate limiting
   - Handle rate limit errors gracefully

## Maintenance

### Regular Tasks

- Monitor cron execution logs
- Review OpenAI API usage
- Update system prompt as needed
- Add new knowledge entries
- Review and update tool descriptions

### Updates

- Keep Vercel AI SDK updated
- Monitor OpenAI model updates
- Review and optimize prompts
- Add new tools as needed

## Support

For issues or questions:

1. Check logs in `/logs` directory
2. Review this documentation
3. Check OpenAI API status
4. Contact development team
