create table if not exists feedback (
  id          bigint generated always as identity primary key,
  message     text        not null,
  category    text        not null default 'general',
  email       text,
  created_at  timestamptz not null default now()
);

-- Only the service role (server) can insert/read; no public access
alter table feedback enable row level security;
