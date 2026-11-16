# Security boundaries and remaining work

This is a fictional-data assessment prototype. These controls are implemented in source; they are not a security certification.

## Implemented

- Node scrypt password hashing with unique salts, explicit cost parameters and timing-safe verification.
- Generic credential errors; database account lockout after five failures; rate limits.
- Random opaque session tokens; only hashes stored in PostgreSQL.
- HttpOnly, SameSite=Lax cookies; Secure and __Host- prefix in production.
- Eight-hour absolute session expiry and thirty-minute inactivity expiry.
- Explicit logout revocation and rotation on login.
- Exact Origin validation on writes, including login; synchroniser CSRF tokens after login.
- Server-side role, mandal and village policy checks. UI controls are not an authority.
- Zod validation; strict request objects; a 32 KB JSON request limit.
- Parameterised SQL for request-derived values.
- Version-conditioned updates and transactional retry receipts.
- Append-only event trigger plus hash-chain checks, including submitted evidence snapshots.
- Helmet response headers; production CSP and HSTS.
- No exception stacks, database messages, credentials or evidence text in client errors/logs. Server logs include sanitised diagnostic codes for troubleshooting.
- AI server-side credentials, timeouts, structured output and human decision boundaries.
- No real identity numbers or phone numbers required by this demonstration.

## Known limits

- Rate-limit counters are in memory and apply per process. Use a shared store before multiple instances.
- Login lockout/rotation spans several SQL operations, not one serialized authentication transaction. Review concurrent login behaviour before production.
- Session/receipt expiry is enforced or retained but scheduled cleanup is not implemented.
- SQL authorization is in the service/query layer, not PostgreSQL RLS. Runtime database privileges must be restricted at deployment.
- The local compose user is a development schema owner. Do not use it as a production runtime role.
- Hashes detect changes in supplied history; they cannot independently detect a privileged rewrite or truncation of all records. Use external anchors and separately controlled backups for stronger assurance.
- Raw typed notes may contain personal information. This demo permits fictional data only; production AI use requires a defined redaction/consent/retention policy.
- Schema validation does not prove AI factual accuracy or eliminate prompt injection.
- No production backup, monitoring, retention scheduler, pen test, malware scanning, upload pipeline or formal accessibility audit is claimed.
- Dependencies are installed and source checks have run. See docs/IMPLEMENTATION_STATUS.md for dependency findings and remaining browser/security regression checks.

## Before deployment

Use verified database TLS, platform HTTPS and a migration owner separate from the application role. Grant only SELECT/INSERT/UPDATE/DELETE where required; history needs SELECT/INSERT only. The runtime role must not own tables, functions or schema and must not have TRUNCATE or trigger-management rights. Keep credentials out of git. Supply unique review-only passwords and rotate them after assessment.

Only set TRUST_PROXY_HOPS to match known infrastructure. Verify forwarded IP behaviour before trusting rate limits. Test same-origin writes and __Host- cookies on the deployed HTTPS origin.

A provider outage must never prevent a manual workflow decision. Test that behaviour, the evidence-review requirement, unauthorized API calls, stale writes and replay before submission.
