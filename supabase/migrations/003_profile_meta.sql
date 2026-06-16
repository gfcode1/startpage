-- Table: profile_meta
-- Stores profile metadata (salt, verification) on cloud so that
-- a new device can discover and unlock profiles without having
-- created them locally first.

CREATE TABLE IF NOT EXISTS profile_meta (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id   TEXT NOT NULL,
  name         TEXT NOT NULL,
  salt         TEXT NOT NULL,
  verification TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_meta_user_id
  ON profile_meta(user_id);

ALTER TABLE profile_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile_meta" ON profile_meta;
CREATE POLICY "Users can read own profile_meta"
  ON profile_meta FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile_meta" ON profile_meta;
CREATE POLICY "Users can insert own profile_meta"
  ON profile_meta FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile_meta" ON profile_meta;
CREATE POLICY "Users can update own profile_meta"
  ON profile_meta FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile_meta" ON profile_meta;
CREATE POLICY "Users can delete own profile_meta"
  ON profile_meta FOR DELETE
  USING (auth.uid() = user_id);
