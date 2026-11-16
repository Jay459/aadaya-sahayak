# Aadaya Sahayak | ఆదాయ సహాయక్

A Telugu-first income-certificate review workspace for village and mandal revenue officers in Telangana.

**GPO field enquiry → Revenue Inspector verification → Tahsildar decision.**

| Assessment access | Details                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| GitHub repository | [Jay459/aadaya-sahayak](https://github.com/Jay459/aadaya-sahayak)      |
| Live application  | https://aadaya-sahayak.onrender.com/                   |
| Interface         | Telugu, with Indian currency formatting and Asia/Kolkata timestamps    |
| Data              | 12 fictional applications in the initial seed; no real citizen records |

## Demo accounts

| Role                   | Username           | Password                                   |
| ---------------------- | ------------------ | ------------------------------------------ |
| GPO / field officer    | `gpo.ramaram`      | Shared evaluation password; see note below |
| Revenue Inspector (RI) | `ri.mandal`        | Shared evaluation password; see note below |
| Tahsildar              | `tahsildar.mandal` | Shared evaluation password; see note below |

<!-- DEMO_PASSWORD_START -->

**Hosted evaluation password:** <code>ajayanthgoud</code>
<!-- DEMO_PASSWORD_END -->

The evaluation password is intended to be shared for this fictional-data assessment. It is separate from the database password and Gemini API key. Do not reuse it for personal accounts or a real government system.

For a fresh local database, set `DEMO_PASSWORD` before seeding. That value becomes the password for all three accounts. Changing `.env` afterward does not change stored passwords. The existing hosted database must use the password originally used to seed its accounts.

## The problem and who it affects

Income-certificate reviews require field enquiry, evidence comparison and an accountable final decision. Paper files and disconnected notes make it difficult for field staff to identify urgent applications, avoid repeated enquiries and understand why a file was returned.

Aadaya Sahayak puts the next action, relevant evidence and application history in one Telugu workspace. It is designed around field officers who need clear language, short forms and a visible handoff to the next officer.

This assessment prototype follows the supplied Aadaya Sahayak PRD with a deliberately simplified three-role chain. It does not determine statutory eligibility, issue an official certificate or integrate with MeeSeva. The exact local departmental process must be validated with officers before a real pilot.

## What the application does

- Displays a priority-sorted application queue, search, and pending, overdue and returned counts.
- Limits GPO access to assigned villages and RI/Tahsildar access to their mandal.
- Captures structured field reports and compares declared, sample-document and field-report income.
- Supports explicit returns, recommendations and final approval or rejection.
- Provides stage-specific AI assistance while leaving every workflow action to the officer.
- Records actor, time, action, reasons and evidence snapshots in application history.
- Saves workflow changes, history and retry receipts together in a PostgreSQL transaction.
- Rejects stale decisions using version checks and handles repeated submissions with idempotency keys.

### Workflow

| Current stage     | Officer   | Action                          | Next stage        |
| ----------------- | --------- | ------------------------------- | ----------------- |
| Pending GPO       | GPO       | Submit field report             | Pending RI        |
| Pending RI        | RI        | Recommend approval or rejection | Pending Tahsildar |
| Pending RI        | RI        | Return with a reason            | Pending GPO       |
| Pending Tahsildar | Tahsildar | Return with a reason            | Pending RI        |
| Pending Tahsildar | Tahsildar | Approve after evidence review   | Approved          |
| Pending Tahsildar | Tahsildar | Reject after evidence review    | Rejected          |

A return clears the previous recommendation, requiring a fresh RI recommendation. Approved and rejected applications cannot be reopened in this scope.

### Suggested reviewer walkthrough

1. Log in as the GPO and open an application pending field enquiry in the assigned village.
2. Enter annual income, household size, occupation and enquiry notes. Optionally ask AI for a draft, review it and submit the report.
3. Log out, log in as the RI and find the same application. Compare the evidence and return it with a reason.
4. As the GPO, correct the report and resubmit. As the RI, record a recommendation.
5. As the Tahsildar, review the evidence and optional AI brief, explicitly confirm evidence review and approve or reject.
6. Inspect history and refresh the page to check the recorded handoffs and final decision.

The seed includes examples at different stages, an income discrepancy and an application outside the GPO's village. Application states change during evaluation; the database does not reset automatically.

## Where AI helps and why

| Stage     | Assistance                                                     | Practical benefit                              |
| --------- | -------------------------------------------------------------- | ---------------------------------------------- |
| GPO       | Convert rough Telugu notes into an editable field-report draft | Reduce repetitive report writing               |
| RI        | Compare supplied income evidence and cite relevant fields      | Help the officer notice inconsistencies        |
| Tahsildar | Summarise supplied evidence and the recommendation             | Reduce the time needed to reconstruct the case |

AI is advisory. It cannot approve, reject, return or move an application. Officers review drafts and make the final decision through normal workflow controls.

Two providers are supported:

- `AI_PROVIDER=mock`: deterministic sample responses, visibly labelled as demonstrations.
- `AI_PROVIDER=gemini`: real provider requests made on the server using a private API key.

Responses are schema-validated and requests have a timeout. Unknown report facts should remain unknown. Provider failure leaves the manual workflow available. Schema validation does not prove factual accuracy or eliminate prompt injection. Use fictional evidence only.

## Technical decisions

| Decision                          | Reason and trade-off                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| React + Express + TypeScript      | Explicit views, controllers and domain/data boundaries with shared types                      |
| One modular application           | Keeps a one-day workflow small enough to finish and review                                    |
| PostgreSQL + `pg`                 | Explicit SQL and transactions make decision integrity easy to inspect                         |
| Service and repository layers     | Separate business rules from HTTP handling and SQL                                            |
| Table-driven state machine        | Make permitted role/state/action combinations visible in one place                            |
| Server-side sessions              | HttpOnly cookies; session tokens stored hashed, never in browser localStorage                 |
| Optimistic concurrency            | Reject stale updates without holding a lock while an officer reads a file                     |
| Database-backed idempotency       | Replay the original result for the same user, key and command                                 |
| Append-only, hash-chained history | Record evidence and detect changes in supplied history; not an independently immutable ledger |
| AI provider adapters              | Keep AI replaceable and manual processing independent of provider availability                |

The React build produces static assets that Express can serve alongside the API. Deployment has not been performed.

### Folder structure

| Path                       | Responsibility                                             |
| -------------------------- | ---------------------------------------------------------- |
| `src/shared/contracts.ts`  | Shared types for applications, officers and commands       |
| `src/server/routes/`       | Endpoints and security middleware composition              |
| `src/server/controllers/`  | Validate HTTP input and return responses                   |
| `src/server/models/`       | Input schemas and workflow transition rules                |
| `src/server/services/`     | Focused business rules and use-case coordination           |
| `src/server/services/ai/`  | Provider interface and Gemini/mock adapters                |
| `src/server/repositories/` | Named, parameterised SQL operations                        |
| `src/server/db/`           | Connections, transactions and migrations                   |
| `src/server/middleware/`   | Authentication, CSRF, origin checks and safe errors        |
| `src/web/features/`        | Login, dashboard and application screens                   |
| `src/web/components/`      | Small shared view components                               |
| `src/web/i18n/`            | Shared Telugu labels                                       |
| `scripts/`                 | Migration, fictional seed, source and submission checks    |
| `tests/unit/`              | Domain rules and security checks                           |
| `tests/integration/`       | Real PostgreSQL workflow, replay, race and rollback checks |

See the [developer guide](docs/DEVELOPER_GUIDE.md) for code-reading order and coding standards, and [architecture notes](docs/ARCHITECTURE.md) for transaction details.

## Run locally

### Prerequisites

- Node.js **24 or newer**, with npm.
- PostgreSQL **16 or newer**, local or hosted (such as Neon).
- Optional: Docker Compose for the included local database.
- A Gemini API key only if you select real AI assistance.

PowerShell examples use `npm.cmd` to avoid Windows script-execution-policy issues. On macOS/Linux use `npm` and replace `Copy-Item` with `cp`.

### 1. Install and configure

Download the repository source or clone its GitHub URL, then open the project folder:

```powershell
cd aadaya-sahayak
npm.cmd ci
Copy-Item .env.example .env
```

Edit `.env` before running migration or seed commands. Never commit that file.

| Variable                | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `NODE_ENV`              | `development` locally; `production` requires an HTTPS application origin |
| `PORT`                  | API port; default `3001`                                                 |
| `APP_ORIGIN`            | Exact browser origin; locally `http://127.0.0.1:5173`                    |
| `DATABASE_URL`          | Runtime database connection string; pooled URL for Neon                  |
| `DATABASE_URL_UNPOOLED` | Optional direct URL for migrations and seed; recommended for Neon        |
| `DEMO_PASSWORD`         | At least 12 characters; used when creating seeded accounts               |
| `AI_PROVIDER`           | `mock` for sample responses or `gemini` for real assistance              |
| `GEMINI_API_KEY`        | Private server-side key, required for Gemini                             |
| `GEMINI_MODEL`          | Model available to your provider account                                 |
| `TRUST_PROXY_HOPS`      | Keep `0` locally; change only to match known hosting infrastructure      |

Use the evaluation password as `DEMO_PASSWORD` if you want a fresh local database to have the documented credentials. You may instead choose a separate local password.

### 2. Choose a database

**Option A — included Docker database**

```powershell
docker compose up -d db
```

The local database URL is already in `.env.example`. Its credentials are development examples only.

**Option B — installed PostgreSQL**

Create a database in PostgreSQL and set `DATABASE_URL`, replacing all placeholders:

```text
postgresql://YOUR_USER:YOUR_PASSWORD@127.0.0.1:5432/YOUR_DATABASE
```

URL-encode special characters when constructing a connection string manually.

**Option C — Neon**

Copy connection strings from your own project's connection settings:

- Pooled hostname containing `-pooler` → `DATABASE_URL`.
- Direct hostname without `-pooler` → `DATABASE_URL_UNPOOLED`.

Retain the provider's TLS settings and certificate validation. Reviewers need app credentials, not database credentials.

### 3. Create the schema and fictional data

Run these commands against a fresh database:

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
```

Migrations are tracked in `schema_migrations`. The seed creates three officers, 12 fictional applications and initial history entries. Imported examples already in progress are labelled `DEMO_IMPORTED`.

Seed refuses to overwrite existing users. Do not rerun it to reset a populated assessment database; use a fresh database for independent testing.

### 4. Start the application

```powershell
npm.cmd run dev
```

Open **http://127.0.0.1:5173**. Use that exact address because writes validate `APP_ORIGIN`. Vite proxies `/api` to the API on port 3001.

`GET /api/v1/health` returns `{"status":"ok"}` after a database query succeeds.

### 5. Enable real AI, optionally

Set `AI_PROVIDER=gemini`, `GEMINI_API_KEY` and `GEMINI_MODEL`, then restart the development process. The configured assessment setup returned structured Telugu output using `gemini-3.1-flash-lite`; provider availability and quotas depend on your account. The example defaults to mock mode so no key is needed to explore the workflow.

### Production build, without deploying

```powershell
npm.cmd run build
npm.cmd start
```

Express serves `dist/web` after a build. For a local single-server preview, set `APP_ORIGIN=http://127.0.0.1:3001`, keep `NODE_ENV=development`, and open that address. Stop the development API first if port 3001 is occupied.

For eventual hosting, supply environment variables privately and set `NODE_ENV=production` with the exact HTTPS `APP_ORIGIN`. The included Dockerfile runs one web service as a non-root user. It reads environment variables supplied by the platform. Migrations and seed are separate preparation steps, not automatic startup actions.

## Quality checks

```powershell
npm.cmd run check:source
npm.cmd run check
npm.cmd audit
```

`check` runs TypeScript, ESLint, Prettier, unit tests, integration tests and the frontend build. Integration tests are **skipped** unless `TEST_DATABASE_URL` is supplied. A skipped suite is not a passing database test.

For a dedicated PostgreSQL test database:

```powershell
$env:TEST_DATABASE_URL = 'postgresql://YOUR_USER:YOUR_PASSWORD@127.0.0.1:5432/aadaya_test'
npm.cmd run test:integration
Remove-Item Env:TEST_DATABASE_URL
```

The suite creates a randomly named isolated schema and drops that schema afterward. Use a dedicated direct test connection with schema-creation permission, never the evaluation database URL.

It tests a return/correction/approval journey, idempotent replay, payload mismatch, simultaneous approvals, rollback after history-write failure and audit update/delete rejection.

[GitHub Actions](.github/workflows/ci.yml) is configured with its own PostgreSQL 16 service. See [implementation status](docs/IMPLEMENTATION_STATUS.md) for observed results rather than just configured checks.

## Security

Controls include salted scrypt password hashes, generic login errors, account lockout, rate limits, hashed opaque sessions, HttpOnly cookies, exact-origin validation, CSRF tokens, jurisdiction checks, strict input validation and parameterised SQL. Production cookies use `Secure` and the `__Host-` prefix.

Private database URLs, provider keys, session cookies, local tooling and `.env` are excluded from the repository. The intentionally published evaluation login is the only shared credential. Diagnostic logs contain error codes, not connection strings or evidence text.

See [SECURITY.md](SECURITY.md) for boundaries and remaining production work. Before real use, separate migration ownership from restricted runtime privileges, add monitoring/backups and validate the workflow with the department.

## How impact would be measured

These are pilot hypotheses, not measured outcomes.

| Metric                | Measurement                                           | Why it matters                                 |
| --------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| Report-writing time   | Observe time per GPO report before and during a pilot | Test whether forms and drafts save effort      |
| End-to-end turnaround | Compare application and final-decision timestamps     | Measure service speed                          |
| Return/rework rate    | Count return events per completed application         | Find incomplete reports and repeated enquiries |
| Queue ageing          | Measure time in each workflow state                   | Locate handoff bottlenecks                     |
| AI usefulness         | Collect officer feedback and draft-editing effort     | Check whether assistance helps                 |
| Decision quality      | Review corrections and appeals with the department    | Ensure faster processing preserves quality     |

Compare a pilot mandal against its own baseline and, where possible, a similar mandal. The expected benefit comes from visible queues, structured evidence and clear return reasons. The current app shows operational counts; full pilot analytics and AI acceptance/edit tracking are future work.

## Troubleshooting

| Symptom                                 | Check                                                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login returns 500; logs contain `28P01` | PostgreSQL rejected database credentials. Correct `DATABASE_URL`; this is separate from the demo account password. Restart after editing `.env`. |
| Invalid login credentials               | Use the exact username and the password used at seed time. Changing `DEMO_PASSWORD` afterward does not reset an account.                         |
| Write requests return 403               | Use the configured `APP_ORIGIN` and a fresh login session.                                                                                       |
| Database connection fails               | Check host, database, credentials, TLS settings and network access.                                                                              |
| AI request fails                        | Check provider settings and quota; continue the manual workflow.                                                                                 |
| Seed refuses to run                     | The database contains users. Use a fresh database rather than overwriting records.                                                               |
| Port is occupied                        | Stop the earlier process or update the port and corresponding proxy/origin settings.                                                             |

## Scope and submission status

Implemented scope: one income-certificate workflow, three roles, Telugu views, fictional evidence, advisory AI and recorded decisions.

Not included: real citizen data, Aadhaar collection, uploads/OCR, voice input, offline processing, government integration, digital signatures, official certificates, SMS or verified statutory eligibility/SLA rules. Demo deadlines use seeded timestamps, not a Telangana working-day calendar. Lists are capped at 200 records; a larger rollout needs pagination and query optimisation.

The developer has confirmed the application works locally. Automated results and remaining verification are recorded in [implementation status](docs/IMPLEMENTATION_STATUS.md).

**Deployment is pending by request.** Before submission, insert the live HTTPS URL, verify it with the documented credentials and finish the [delivery checklist](docs/DELIVERY_CHECKLIST.md). A short walkthrough video is optional.
