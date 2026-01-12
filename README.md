# Chat AI

Chat AI is a SaaS platform being built to let businesses connect WhatsApp and configure an AI assistant that replies to new chats with company knowledge.

## Product vision

1. The user signs up with a Google account.
2. The user links a WhatsApp account/session.
3. The user defines the AI system prompt.
4. The user uploads or maintains the AI knowledge base.
5. When a new chat opens, the AI replies using the configured knowledge.

## Repository structure

- `web/`: Next.js dashboard and user experience.
- `api/`: NestJS backend with AI, knowledge, chat history, and WAHA integrations.
