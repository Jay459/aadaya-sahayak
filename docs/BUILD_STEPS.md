# Build checkpoints

The code is organised so each checkpoint can be reviewed independently.

| Order | Checkpoint                     | Files to inspect                                   | Verification                         |
| ----- | ------------------------------ | -------------------------------------------------- | ------------------------------------ |
| 1     | Folder structure and tooling   | package.json, tsconfig.json, eslint.config.js      | Install, format, typecheck           |
| 2     | Shared data model and workflow | src/shared/contracts.ts, server/models/workflow.ts | Workflow matrix tests                |
| 3     | Security boundaries            | server/services/access-policy.ts, middleware       | Authorization and CSRF tests         |
| 4     | Persistence                    | server/db, repositories, scripts                   | Migrate/seed a local database        |
| 5     | Atomic application actions     | server/services/application-service.ts             | Replay, race and rollback tests      |
| 6     | Telugu views                   | src/web/features                                   | Mobile and keyboard walkthrough      |
| 7     | AI assistance                  | server/services/ai                                 | Real-provider checks and outage path |
| 8     | Delivery                       | Dockerfile, .github, README                        | Clean build and public smoke test    |

Checkpoints 1-7 have source implementation. Their environment-dependent checks remain open. Begin by completing the dependency installation and TypeScript/lint/build checks before changing features.
