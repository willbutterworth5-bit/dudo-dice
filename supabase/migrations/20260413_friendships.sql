-- Friendships / friend requests between authenticated users.

CREATE TABLE friendships (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  requester_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Only the requester can create the row
CREATE POLICY "send friend request"
  ON friendships FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

-- Either party can read the row
CREATE POLICY "view own friendships"
  ON friendships FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Only the addressee can accept
CREATE POLICY "accept request"
  ON friendships FOR UPDATE TO authenticated
  USING (addressee_id = auth.uid());

-- Either party can remove/cancel
CREATE POLICY "remove friend"
  ON friendships FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- RPC: look up a player by username, returns id + display fields
CREATE OR REPLACE FUNCTION find_player_by_username(p_username TEXT)
RETURNS TABLE(user_id UUID, username TEXT, name TEXT, rating INT, country TEXT)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT p.id, p.username, p.name,
         r.rating::INT,
         p.country
  FROM profiles p
  LEFT JOIN player_ratings r ON r.id = p.id
  WHERE LOWER(p.username) = LOWER(p_username)
    AND p.username IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION find_player_by_username TO authenticated;
