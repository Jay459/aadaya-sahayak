# Developer guide

## Read the code in this order

1. src/shared/contracts.ts: learn the vocabulary and data shapes.
2. src/server/models/workflow.ts: see all six allowed transitions in one table.
3. src/server/services/access-policy.ts: see which applications each officer may access.
4. src/server/models/validation.ts: see what an HTTP caller may submit.
5. src/server/controllers/application-controller.ts: see request parsing.
6. src/server/services/application-service.ts: follow one business operation.
7. src/server/repositories/application-repository.ts: see the corresponding SQL.
8. src/web/features/applications/ActionForm.tsx: see how the UI sends an intent.

## One request, one clear path

React sends a typed command. The route attaches security checks. The controller validates the request. The service checks business rules and coordinates a transaction. Repositories perform SQL using that same transaction client. The controller returns a result.

Controllers do not calculate priority or write SQL. Repositories do not decide whether an officer may approve. Components do not determine server permissions.

## What “single responsibility” means here

Each helper has one reason to change. requireReason validates reasons. priorityScore computes priority. updateApplication performs one version-checked write.

A use-case service may call several helpers: its single responsibility is coordinating that operation. Splitting every statement into another service would make the code harder to follow.

## Patterns we use

| Pattern                    | Concrete use                                         |
| -------------------------- | ---------------------------------------------------- |
| MVC-style layering         | React views, HTTP controllers and domain/data models |
| Service layer              | Application, authentication and AI use cases         |
| Repository                 | Named, parameterised database operations             |
| Transaction boundary       | One database client for all writes in a transition   |
| Adapter                    | Gemini and deterministic mock implementations        |
| Table-driven state machine | Explicit state/action/role transitions               |
| Optimistic concurrency     | expectedVersion and UPDATE WHERE version             |
| Dependency injection       | Factories receive database, provider or clock        |

No generic BaseRepository, service locator, inheritance hierarchy, microservices, CQRS or unnecessary factory classes.

## Adding a field

Update the shared contract, boundary schema and form. Decide whether it belongs in the application JSON payload or a new relational column. Add a migration for any relational changes. Review whether AI may receive it and whether the history should record it. Add a meaningful test for changed behaviour.

## Adding an action

Add a transition rule and its guards. Use the server's allowedActions response to display it. Update Telugu labels. Add tests for allowed and forbidden roles, invalid source states, and any required evidence. Never make UI visibility the only permission check.

## Naming and code style

- Prefer submitReport or requireReason over processData or handleThing.
- Use early returns and small pure helpers.
- Keep functions focused on one business operation.
- Name booleans as questions or facts: reviewedEvidence, canAccessApplication.
- Validate unknown data at HTTP and provider boundaries.
- Import types with import type; do not use any to silence the compiler.
- Add comments for a constraint or trade-off, not a line-by-line translation.
- Keep UI copy clear in Telugu. Shared workflow labels belong in src/web/i18n.
- Run npm run format before committing and npm run check before a review.
- Write tests for permissions, money/evidence rules, transitions, retries and failures.
- Never log passwords, cookies, provider secrets or free-text citizen evidence.

## Safe failure handling

An invalid form returns 422. Missing or expired login returns 401. Forbidden origin/CSRF returns 403. An out-of-jurisdiction application returns 404. A stale application version returns 409. An unavailable provider returns 503 from the AI endpoint only.

If PostgreSQL rejects a transition write, the transaction rolls back the state, event and retry receipt. Never send notifications inside a database transaction; introduce an outbox if notifications enter scope.

## Local verification limits

Read docs/IMPLEMENTATION_STATUS.md before assuming a check passed. Source files existing is not proof that the app built, loaded in a browser or passed integration tests.
