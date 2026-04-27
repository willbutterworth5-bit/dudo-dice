import { supabase } from '../lib/supabase';

export interface FriendEntry {
  friendshipId: number;
  userId: string;
  username: string | null;
  name: string;
  rating: number | null;
  country: string | null;
  status: 'pending' | 'accepted';
  direction: 'sent' | 'received';
}

export interface PlayerSearchResult {
  userId: string;
  username: string;
  name: string;
  rating: number | null;
  country: string | null;
}

export async function getFriends(myUserId: string): Promise<FriendEntry[]> {
  if (!supabase) return [];

  const { data: rows } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(`requester_id.eq.${myUserId},addressee_id.eq.${myUserId}`);

  if (!rows || rows.length === 0) return [];

  const friendIds = rows.map(r =>
    r.requester_id === myUserId ? r.addressee_id : r.requester_id
  );

  const [{ data: profiles }, { data: ratings }] = await Promise.all([
    supabase.from('profiles').select('id, name, username, country').in('id', friendIds),
    supabase.from('player_ratings').select('id, rating').in('id', friendIds),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
  const ratingMap = Object.fromEntries((ratings ?? []).map(r => [r.id, r.rating as number]));

  return rows.map(r => {
    const friendId = r.requester_id === myUserId ? r.addressee_id : r.requester_id;
    const p = profileMap[friendId] ?? {};
    return {
      friendshipId: r.id as number,
      userId: friendId,
      username: (p.username as string | undefined) ?? null,
      name: (p.name as string | undefined) ?? 'Unknown',
      rating: ratingMap[friendId] ?? null,
      country: (p.country as string | undefined) ?? null,
      status: r.status as 'pending' | 'accepted',
      direction: r.requester_id === myUserId ? 'sent' : 'received',
    };
  });
}

export async function sendFriendRequest(
  myUserId: string,
  addresseeId: string,
): Promise<'ok' | 'already_sent' | 'error'> {
  if (!supabase) return 'error';
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: myUserId, addressee_id: addresseeId });
  if (!error) return 'ok';
  if (error.code === '23505') return 'already_sent';
  return 'error';
}

export async function respondToRequest(friendshipId: number, accept: boolean): Promise<void> {
  if (!supabase) return;
  if (accept) {
    await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
  } else {
    await supabase.from('friendships').delete().eq('id', friendshipId);
  }
}

export async function removeFriend(friendshipId: number): Promise<void> {
  if (!supabase) return;
  await supabase.from('friendships').delete().eq('id', friendshipId);
}

export async function findPlayerByUsername(username: string): Promise<PlayerSearchResult | null> {
  if (!supabase) return null;
  const clean = username.trim().replace(/^@/, '');
  if (!clean) return null;
  const { data } = await supabase.rpc('find_player_by_username', { p_username: clean });
  if (!data || data.length === 0) return null;
  const row = data[0] as { user_id: string; username: string; name: string; rating: number | null; country: string | null };
  return {
    userId: row.user_id,
    username: row.username,
    name: row.name,
    rating: row.rating,
    country: row.country,
  };
}
