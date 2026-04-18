CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id    VARCHAR(255) UNIQUE NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255),
  avatar_url   TEXT,
  language     VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  type         VARCHAR(255),
  year         INTEGER,
  description  TEXT,
  photo_url    TEXT,
  is_public    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS boats_user_id_idx ON boats(user_id);
