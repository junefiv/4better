-- 4better V1 Core MVP migration for project iaslvwciprbtcrcoafoi
-- Idempotent where practical. V1 only calculates settlement estimates; it never holds or transfers money.

alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists push_consent_at timestamptz;
alter table public.rooms add column if not exists ended_at timestamptz;
alter table public.records add column if not exists finalized_at timestamptz;

create table if not exists public.timer_sessions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  owner_id uuid not null references public.profiles(id),
  started_at timestamptz not null default now(),
  paused_at timestamptz,
  accumulated_seconds integer not null default 0 check (accumulated_seconds >= 0),
  ended_at timestamptz,
  record_id uuid references public.records(id),
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create unique index if not exists timer_sessions_one_running_per_user
  on public.timer_sessions(owner_id) where ended_at is null;

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(user_id, expo_token)
);

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  reported_user_id uuid references public.profiles(id),
  record_id uuid references public.records(id),
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (reported_user_id is not null or record_id is not null)
);

create table if not exists public.user_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_results (
  week_id uuid not null references public.weeks(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  confirmed_value integer not null default 0,
  achievement_bps integer not null default 0,
  rank smallint,
  penalty_estimate_won integer not null default 0,
  reward_estimate_won integer not null default 0,
  calculated_at timestamptz not null default now(),
  primary key (week_id, user_id),
  check (confirmed_value >= 0 and achievement_bps >= 0 and penalty_estimate_won >= 0 and reward_estimate_won >= 0)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('review_request', 'review_reminder', 'week_deadline', 'extension_request', 'upload_failed')),
  payload jsonb not null default '{}'::jsonb,
  run_after timestamptz not null default now(),
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'failed', 'cancelled')),
  attempts smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.timer_sessions enable row level security;
alter table public.push_tokens enable row level security;
alter table public.user_blocks enable row level security;
alter table public.reports enable row level security;
alter table public.user_restrictions enable row level security;
alter table public.weekly_results enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notification_jobs enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_room_member(target_room_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.room_members where room_id = target_room_id and user_id = auth.uid() and left_at is null)
$$;

create or replace function public.is_room_owner(target_room_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.rooms where id = target_room_id and owner_id = auth.uid())
$$;

drop policy if exists "members can read memberships" on public.room_members;
create policy "members can read memberships" on public.room_members for select to authenticated
  using (public.is_room_member(room_id) or public.is_admin());

create policy "members read rules" on public.rule_versions for select to authenticated
  using (public.is_room_member(room_id) or public.is_admin());
create policy "owners create rules" on public.rule_versions for insert to authenticated
  with check (public.is_room_owner(room_id) and created_by = auth.uid());
create policy "members read agreements" on public.rule_agreements for select to authenticated
  using (exists(select 1 from public.rule_versions rv where rv.id = rule_version_id and public.is_room_member(rv.room_id)) or public.is_admin());
create policy "users decide own agreement" on public.rule_agreements for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owners seed agreements" on public.rule_agreements for insert to authenticated
  with check (exists(select 1 from public.rule_versions rv where rv.id = rule_version_id and public.is_room_owner(rv.room_id)));

create policy "members read weeks" on public.weeks for select to authenticated
  using (public.is_room_member(room_id) or public.is_admin());
create policy "owners manage weeks" on public.weeks for all to authenticated
  using (public.is_room_owner(room_id)) with check (public.is_room_owner(room_id));
create policy "members read week members" on public.week_members for select to authenticated
  using (exists(select 1 from public.weeks w where w.id = week_id and public.is_room_member(w.room_id)) or public.is_admin());

create policy "members read records" on public.records for select to authenticated
  using (exists(select 1 from public.weeks w where w.id = week_id and public.is_room_member(w.room_id)) or public.is_admin());
create policy "users create own records" on public.records for insert to authenticated
  with check (owner_id = auth.uid() and exists(select 1 from public.weeks w where w.id = week_id and public.is_room_member(w.room_id)));
create policy "users update own unconfirmed records" on public.records for update to authenticated
  using (owner_id = auth.uid() and status <> 'confirmed') with check (owner_id = auth.uid());
create policy "members read record versions" on public.record_versions for select to authenticated
  using (exists(select 1 from public.records r join public.weeks w on w.id = r.week_id where r.id = record_id and public.is_room_member(w.room_id)) or public.is_admin());
create policy "owners create record versions" on public.record_versions for insert to authenticated
  with check (exists(select 1 from public.records r where r.id = record_id and r.owner_id = auth.uid()));
create policy "members read reviews" on public.record_reviews for select to authenticated
  using (exists(select 1 from public.record_versions rv join public.records r on r.id = rv.record_id join public.weeks w on w.id = r.week_id where rv.id = record_version_id and public.is_room_member(w.room_id)) or public.is_admin());
create policy "members create own reviews" on public.record_reviews for insert to authenticated
  with check (reviewer_id = auth.uid() and exists(select 1 from public.record_versions rv join public.records r on r.id = rv.record_id join public.weeks w on w.id = r.week_id where rv.id = record_version_id and r.owner_id <> auth.uid() and public.is_room_member(w.room_id)));

create policy "members read media" on public.media for select to authenticated
  using (exists(select 1 from public.record_versions rv join public.records r on r.id = rv.record_id join public.weeks w on w.id = r.week_id where rv.id = record_version_id and public.is_room_member(w.room_id)) or public.is_admin());
create policy "owners manage media" on public.media for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "members read extension proposals" on public.extension_proposals for select to authenticated using (public.is_room_member(room_id) or public.is_admin());
create policy "owners create extension proposals" on public.extension_proposals for insert to authenticated with check (public.is_room_owner(room_id) and proposed_by = auth.uid());
create policy "members read extension votes" on public.extension_votes for select to authenticated using (exists(select 1 from public.extension_proposals ep where ep.id = proposal_id and public.is_room_member(ep.room_id)) or public.is_admin());
create policy "users manage own extension vote" on public.extension_votes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users manage own timer" on public.timer_sessions for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "users manage own push tokens" on public.push_tokens for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage own blocks" on public.user_blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "users create reports" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "users read own reports" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
create policy "admins manage reports" on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage restrictions" on public.user_restrictions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "users read own restrictions" on public.user_restrictions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "members read weekly results" on public.weekly_results for select to authenticated using (exists(select 1 from public.weeks w where w.id = week_id and public.is_room_member(w.room_id)) or public.is_admin());
create policy "admins read audit logs" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "users read own notification jobs" on public.notification_jobs for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.join_room_by_code(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare target_room public.rooms; member_count integer;
begin
  select * into target_room from public.rooms where invite_code = upper(trim(code)) and status in ('recruiting', 'agreement_pending');
  if target_room.id is null then raise exception 'INVITE_NOT_FOUND'; end if;
  if exists(select 1 from public.user_blocks where (blocker_id = auth.uid() and blocked_id = target_room.owner_id) or (blocker_id = target_room.owner_id and blocked_id = auth.uid())) then raise exception 'INVITE_BLOCKED'; end if;
  select count(*) into member_count from public.room_members where room_id = target_room.id and left_at is null;
  if member_count >= 4 then raise exception 'ROOM_FULL'; end if;
  insert into public.room_members(room_id, user_id) values(target_room.id, auth.uid()) on conflict do nothing;
  return target_room.id;
end;
$$;

create or replace function public.sync_record_confirmation()
returns trigger language plpgsql security definer set search_path = public as $$
declare target_record public.records; required_count integer; approved_count integer;
begin
  select r.* into target_record from public.record_versions rv join public.records r on r.id = rv.record_id where rv.id = new.record_version_id;
  if new.decision = 'rejected' then update public.records set status = 'rejected' where id = target_record.id; return new; end if;
  if new.decision = 'changes_requested' then update public.records set status = 'changes_requested' where id = target_record.id; return new; end if;
  select greatest(count(*) - 1, 1) into required_count from public.room_members rm join public.weeks w on w.room_id = rm.room_id where w.id = target_record.week_id and rm.left_at is null;
  select count(*) into approved_count from public.record_reviews where record_version_id = new.record_version_id and decision = 'approved';
  if approved_count >= required_count then
    update public.records r set status = 'confirmed', confirmed_value = rv.measured_value, finalized_at = now()
      from public.record_versions rv where r.id = target_record.id and rv.id = new.record_version_id and rv.version = r.current_version;
  end if;
  return new;
end;
$$;

drop trigger if exists on_record_reviewed on public.record_reviews;
create trigger on_record_reviewed after insert or update on public.record_reviews for each row execute function public.sync_record_confirmation();

create index if not exists records_week_owner_idx on public.records(week_id, owner_id);
create index if not exists reviews_decision_idx on public.record_reviews(record_version_id, decision);
create index if not exists notification_jobs_due_idx on public.notification_jobs(status, run_after) where status = 'queued';
create index if not exists reports_status_idx on public.reports(status, created_at desc);
