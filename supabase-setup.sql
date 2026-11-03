-- 工作紀錄：Supabase 資料表設定
-- 在 Supabase → SQL Editor 貼上整段，按 Run 執行一次即可。

create table if not exists public.worklog_days (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        text not null,               -- 'YYYY-MM-DD'
  data       jsonb not null,              -- { note, tasks: [...], events: [...] }
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- 每個人只能讀寫自己的紀錄
alter table public.worklog_days enable row level security;

drop policy if exists "own rows" on public.worklog_days;
create policy "own rows" on public.worklog_days
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
