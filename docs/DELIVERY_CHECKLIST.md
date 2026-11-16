# Delivery checkpoints

## Structure and implementation

- [x] MVC-style folders, focused services, repositories and shared contracts.
- [x] Node, TypeScript, React, Express and PostgreSQL configuration.
- [x] Validation, authentication, CSRF, origin and jurisdiction boundaries.
- [x] Three stages, role-specific actions and explicit return paths.
- [x] Transactional state/history/receipt writes and version checks.
- [x] Telugu views, application history and AI provider adapters.
- [x] Repository migration and fictional seed verified on Neon.
- [x] Developer confirmed the local application works.

## Documentation and review preparation

- [x] README explains the problem, users, workflow, AI, impact measurement and technical decisions.
- [x] Local installation, environment, migration, seed and troubleshooting instructions.
- [x] Role usernames and a reviewer walkthrough.
- [x] Architecture, developer guide and security boundaries.
- [x] Explicit scope limits and deployment marked pending.
- [x] Insert the evaluation password from the configured local machine using `npm run docs:demo`.

## Verification

- [x] Clean dependency installation and lockfile.
- [x] Source, TypeScript, ESLint, Prettier and production build checks.
- [x] Forty unit tests passed.
- [x] Real Gemini returned structured Telugu output in earlier verification.
- [ ] Run dedicated PostgreSQL integration tests; skipped locally without TEST_DATABASE_URL.
- [ ] Inspect GitHub Actions results after publication.
- [x] Run dependency audit: seven moderate development-tooling findings recorded; no high or critical findings.
- [ ] Resolve or explicitly document the remaining development-tooling advisories.
- [ ] Record mobile, keyboard and accessibility checks.
- [ ] Record HTTP session, logout, jurisdiction, origin and CSRF regression checks.
- [ ] Evaluate missing facts, prompt injection, malformed AI output and provider outage in the running app.

## Publication and submission

- [x] Create the accessible GitHub repository and prepare the source for publication.
- [x] Put the verified repository URL in the README.
- [ ] Deploy separately when requested.
- [ ] Add and verify the exact public HTTPS URL in a logged-out browser.
- [ ] Verify the documented demo credentials on that deployment.
- [ ] Optional short walkthrough video.
