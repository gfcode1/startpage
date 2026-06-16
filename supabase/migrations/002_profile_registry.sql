-- Table: profile_registry
-- Maps (user_id, profile_name) → profile_id across devices
-- Enables multi-device sync by letting second devices adopt
-- the same profile_id as the first device

CREATE TABLE IF NOT EXISTS profile_registry (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_registry_user_name
  ON profile_registry(user_id, name);

-- Row-level security: users can only see/edit their own entries
ALTER TABLE profile_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own registry" ON profile_registry;
CREATE POLICY "Users can read own registry"
  ON profile_registry FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own registry" ON profile_registry;
CREATE POLICY "Users can insert own registry"
  ON profile_registry FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own registry" ON profile_registry;
CREATE POLICY "Users can delete own registry"
  ON profile_registry FOR DELETE
  USING (auth.uid() = user_id);
