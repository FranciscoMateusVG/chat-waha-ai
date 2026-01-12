# Agent Rules

## Defaults

- Use **pnpm** only.
- UI must be in **PT-BR** (labels, buttons, messages). Code identifiers can be English.
- Use **Tailwind** and **shadcn/ui** components (added via shadcn CLI).
- Prefer **Next.js Server Components by default**.
- Prefer **Server Actions** over REST APIs. Do not build a REST layer unless explicitly requested.
- Avoid adding new dependencies unless truly necessary.

## Components & Architecture

- Keep UI small and composable (atomic-ish): extract reusable atoms/molecules when repetition appears.
- Only use `"use client"` when necessary (interactivity, hooks, browser APIs). Keep client components small and isolated.
- Avoid over-abstraction early; prioritize readability.

## Domain & Architecture (DDD)

- When implementing backend logic, **follow Domain-Driven Design (DDD) principles whenever possible**.
- Separate concerns clearly:
  - **Domain**: entities, value objects, domain services, business rules
  - **Application**: use cases / server actions orchestrating domain logic
  - **Infrastructure**: database access, external services
- Keep domain logic **framework-agnostic**.
- UI components must not contain business rules.
- Do not over-engineer DDD for trivial features; apply it where business rules exist.

## Testing

- New logic must include **unit tests** and they must pass locally.
- Prioritize unit tests for **pure functions, domain logic, server actions, and utilities**.
- UI/component tests are optional unless explicitly requested.

## Linting / Tooling

- Do not spend time on cosmetic ESLint cleanup.
- Fix anything that breaks **build, typecheck, or tests**.

## Documentation

- Do not create or modify README/docs files unless explicitly requested.
