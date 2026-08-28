-- 長者健康自我管理：Supabase 跨平台同步資料表
-- 可直接貼到 Supabase SQL Editor 執行一次。

create table if not exists public.health_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  client_id text,
  updated_at timestamptz not null default now()
);

alter table public.health_snapshots enable row level security;

-- 以資料庫伺服器時間作同步版本時間，避免不同手機／電腦時鐘有偏差。
create or replace function public.touch_health_snapshot_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists health_snapshots_touch_updated_at on public.health_snapshots;
create trigger health_snapshots_touch_updated_at
before update on public.health_snapshots
for each row execute function public.touch_health_snapshot_updated_at();

-- 2026 起新 Supabase 專案可能不會自動把新表暴露給 Data API，
-- 所以明確授權 authenticated；不授權 anon。
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.health_snapshots to authenticated;
revoke all on table public.health_snapshots from anon;

-- 每位登入使用者只可讀取自己的健康資料。
drop policy if exists "health_snapshots_select_own" on public.health_snapshots;
create policy "health_snapshots_select_own"
on public.health_snapshots
for select
to authenticated
using ((select auth.uid()) = user_id);

-- 只可新增屬於自己的資料列。
drop policy if exists "health_snapshots_insert_own" on public.health_snapshots;
create policy "health_snapshots_insert_own"
on public.health_snapshots
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- UPDATE 同時限制舊列及新列的 user_id，防止改成其他使用者。
drop policy if exists "health_snapshots_update_own" on public.health_snapshots;
create policy "health_snapshots_update_own"
on public.health_snapshots
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- 如日後需要清除雲端資料，亦只可刪自己的資料列。
drop policy if exists "health_snapshots_delete_own" on public.health_snapshots;
create policy "health_snapshots_delete_own"
on public.health_snapshots
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- 啟用 Postgres Changes，讓同一帳戶在另一部已開啟裝置更新後可即時同步。
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'health_snapshots'
  ) then
    alter publication supabase_realtime add table public.health_snapshots;
  end if;
end
$$;
