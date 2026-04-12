-- Add persistent_id to game_sessions for guest player tracking
alter table game_sessions
  add column if not exists persistent_id text;

-- Analytics RPC: overall summary
-- SECURITY DEFINER so it bypasses per-row RLS and reads all sessions
create or replace function get_analytics_summary()
returns json
language sql
security definer
as $$
  select json_build_object(
    'total_games',            count(*),
    'unique_players',         count(distinct coalesce(user_id::text, persistent_id)),
    'unique_guests',          count(distinct persistent_id) filter (where user_id is null and persistent_id is not null),
    'registered_user_games',  count(*) filter (where user_id is not null),
    'guest_games',            count(*) filter (where user_id is null),
    'vs_ai_games',            count(*) filter (where session_type = 'vs_ai'),
    'online_games',           count(*) filter (where session_type = 'online'),
    'wins',                   count(*) filter (where result = 'win'),
    'losses',                 count(*) filter (where result = 'loss'),
    'abandoned',              count(*) filter (where result = 'abandoned'),
    'avg_rounds',             round(avg(rounds_played)::numeric, 1),
    'avg_duration_seconds',   round(avg(duration_seconds)::numeric, 0),
    'registered_users',       (select count(*) from profiles)
  )
  from game_sessions;
$$;

-- Analytics RPC: games per day for the last N days
create or replace function get_games_by_day(days_back int default 30)
returns table(day date, game_count bigint, unique_players bigint)
language sql
security definer
as $$
  select
    played_at::date                                                           as day,
    count(*)                                                                  as game_count,
    count(distinct coalesce(user_id::text, persistent_id))                    as unique_players
  from game_sessions
  where played_at >= now() - (days_back || ' days')::interval
  group by played_at::date
  order by day;
$$;
