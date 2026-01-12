# Design Log 0001: Project Overview

Date: 2025-02-14
Status: Draft

## Context

We need an immutable, version-controlled design log that captures the current architecture and product intent so future work does not repeatedly rebuild context. This log documents the current repository structure and the intended product flow for the Chat AI SaaS.

## Product intent

Chat AI is planned as a SaaS product where a user:

1. Signs up with a Google account.
2. Links a WhatsApp account/session.
3. Defines a system prompt for the AI.
4. Adds or maintains an AI knowledge base.
5. Receives automated AI responses when new chats open, using the configured knowledge.

## Repository structure (current)

- `web/`: Next.js app for the dashboard and user experience.
- `api/`: NestJS backend with AI, knowledge, chat history, notifications, and WAHA integration.
- `mail/`: Present in the repo; purpose not yet documented.
- `design-log/`: Design decisions (this file).

## Architectural notes

- Backend follows a modular layout with clear domain, application, and infrastructure layering.
- Knowledge and system prompt appear as persisted entities in the backend.
- WhatsApp integration appears to be handled via WAHA services.
- Frontend uses Next.js with server components by default and shadcn/ui.

## Decisions

- Keep product configuration (system prompt, knowledge base, WhatsApp connection) in the backend domain layer.
- Use the `design-log/` folder as the canonical place for architecture and product intent snapshots.

## Open questions

- What is the exact OAuth flow for Google sign-in, and which provider will be used?
- How is WhatsApp linking handled for multiple tenants (one session per user or shared)?
- How is knowledge uploaded and indexed (text only, files, embeddings)?

## Next steps

- Add a follow-up design log that captures the auth, billing, and WhatsApp connection flows once defined.
