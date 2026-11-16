CREATE TABLE users (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('GPO', 'RI', 'TAHSILDAR')),
  mandal_id text NOT NULL,
  village_ids text[] NOT NULL DEFAULT '{}',
  failed_logins integer NOT NULL DEFAULT 0,
  locked_until timestamptz
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  csrf_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE applications (
  id uuid PRIMARY KEY,
  mandal_id text NOT NULL,
  village_id text NOT NULL,
  state text NOT NULL CHECK (state IN ('PENDING_GPO', 'PENDING_RI', 'PENDING_TAHSILDAR', 'APPROVED', 'REJECTED')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object')
);
CREATE INDEX applications_queue_idx ON applications(mandal_id, state, village_id);

CREATE TABLE application_events (
  sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id uuid NOT NULL UNIQUE,
  application_id uuid NOT NULL REFERENCES applications(id),
  payload jsonb NOT NULL,
  hash text NOT NULL
);
CREATE INDEX application_events_timeline_idx ON application_events(application_id, sequence);

CREATE FUNCTION reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Application history is append-only';
END;
$$;
CREATE TRIGGER immutable_events BEFORE UPDATE OR DELETE ON application_events
FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();

CREATE TABLE idempotency_receipts (
  user_id uuid NOT NULL REFERENCES users(id),
  key uuid NOT NULL,
  request_hash text NOT NULL,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

CREATE TABLE ai_suggestions (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES applications(id),
  actor_id uuid NOT NULL REFERENCES users(id),
  application_version integer NOT NULL,
  feature text NOT NULL CHECK (feature IN ('report', 'discrepancies', 'brief')),
  provider text NOT NULL CHECK (provider IN ('mock', 'gemini')),
  prompt_version text NOT NULL,
  output jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
