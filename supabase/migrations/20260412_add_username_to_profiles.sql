-- Add username column to profiles (nullable for existing users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Case-insensitive unique index (allows NULL, but any non-null value must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON profiles (LOWER(username))
  WHERE username IS NOT NULL;

-- RPC function callable by unauthenticated users to check availability
CREATE OR REPLACE FUNCTION is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE LOWER(username) = LOWER(p_username)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_username_available(TEXT) TO anon, authenticated;
