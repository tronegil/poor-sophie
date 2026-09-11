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

-- Phase 2: Maintenance planner
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id      UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  template_key VARCHAR(100),
  name_en      VARCHAR(255) NOT NULL,
  name_no      VARCHAR(255) NOT NULL,
  season       VARCHAR(20) NOT NULL CHECK (season IN ('spring','summer','autumn','winter')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  is_custom    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS maintenance_tasks_boat_id_idx ON maintenance_tasks(boat_id);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        UUID NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  notes          TEXT,
  cost_nok       NUMERIC(10,2),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS maintenance_logs_task_id_idx ON maintenance_logs(task_id);

CREATE TABLE IF NOT EXISTS maintenance_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id      UUID NOT NULL REFERENCES maintenance_logs(id) ON DELETE CASCADE,
  data        TEXT NOT NULL,
  category    VARCHAR(20) NOT NULL CHECK (category IN ('job','receipt')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS maintenance_photos_log_id_idx ON maintenance_photos(log_id);

-- Phase 3: Boat Wiki
CREATE TABLE IF NOT EXISTS wiki_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id     UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('pdf','text','url','youtube')),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  url         TEXT,
  file_data   TEXT,
  file_name   VARCHAR(255),
  file_size   INTEGER,
  youtube_id  VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS wiki_items_boat_id_idx ON wiki_items(boat_id);

ALTER TABLE wiki_items ADD COLUMN IF NOT EXISTS cloudinary_id VARCHAR(500);

-- Phase 4: AI Chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id    UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_messages_boat_user_idx ON chat_messages(boat_id, user_id, created_at);

-- Phase 6: Passage seasickness score — hull data the motion model needs
ALTER TABLE boats ADD COLUMN IF NOT EXISTS loa_m NUMERIC(5,2);
ALTER TABLE boats ADD COLUMN IF NOT EXISTS displacement_kg INTEGER;
ALTER TABLE boats ADD COLUMN IF NOT EXISTS hull_type VARCHAR(20) CHECK (hull_type IN ('monohull','catamaran','trimaran'));
ALTER TABLE boats ADD COLUMN IF NOT EXISTS keel_type VARCHAR(20) CHECK (keel_type IN ('fin','long','bilge','lifting','centerboard'));
