# Architecture and trade-offs

## Request flow

React views send typed commands through the API client. Express routes apply security middleware. Controllers validate input and delegate to focused services. Services enforce business rules and call named repository functions. Repositories run parameterised SQL.

The domain rules depend on shared types and small error helpers, not Express or PostgreSQL. Tests can import them directly using Node 24.

## Decision transaction

1. Read the application and check the officer's jurisdiction.
2. Reserve a user-scoped idempotency key, or replay an existing receipt.
3. Verify the expected version, permitted transition and required evidence.
4. UPDATE the application with a WHERE version condition.
5. Append an evidence-bearing audit event.
6. Store the response under the reserved key.
7. Commit everything together, or roll everything back.

The transaction uses a single PostgreSQL client. The conditional application update acquires a short row lock through commit; no lock is held while a person examines a file. A concurrent stale command receives 409. A repeated successful intent receives its original response.

## Why these patterns

| Choice                    | Reason                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Small service functions   | Easy to read, test and change one rule                                             |
| Factories for services    | Explicit dependencies without a DI container                                       |
| Flat transition table     | All permitted role/state/action combinations visible in one place                  |
| Separate SQL repositories | Business rules stay free of query syntax                                           |
| JSONB evidence payload    | Keeps the one-day model compact while state/jurisdiction/version remain relational |
| One deployable server     | Lower operational overhead for an assessment                                       |
| Separate frontend build   | Clear view/controller separation requested by the user                             |

JSONB makes this small prototype fast to evolve; a larger system should normalise searchable/reportable evidence fields and add data-level constraints. Current list queries are capped at 200 demo records; proper cursor pagination and database-side priority sorting are needed for scale.

## Failure behaviour

AI calls occur outside workflow transactions. AI failure cannot roll back or block a manual decision. This scope has no external notifications; a transactional outbox is the next step if notifications are added.

History hashes are recomputed over recorded content and linked to the previous event. The database trigger rejects event updates/deletes. A separate non-owner runtime role is required to protect against trigger removal and table truncation. External anchoring is needed for independent tamper assurance.

## Chosen scope

Income certificate only, one fictional mandal, three roles, a simplified three-stage chain, explicit returns, a manual evidence checklist and AI drafts. There are no legal eligibility decisions, government verification calls, claims of a statutory SLA, or official certificate generation.

## Checks still required

TypeScript, lint, formatting, unit tests and the frontend build have passed. Gemini returned structured Telugu output, and the developer confirmed the local application works. Real PostgreSQL integration checks and detailed browser accessibility/mobile QA still need recorded execution; deployment is outside the current task. See IMPLEMENTATION_STATUS.md.
