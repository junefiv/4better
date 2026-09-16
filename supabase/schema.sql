-- 4better V0/V1-ready schema for project iaslvwciprbtcrcoafoi
create extension if not exists pgcrypto;

create type public.room_status as enum ('recruiting', 'agreement_pending', 'active', 'extension_pending', 'completed', 'archived');
create type public.member_role as enum ('owner', 'member');
create type public.agreement_decision as enum ('pending', 'agreed', 'declined');
create type public.record_status as enum ('draft', 'pending_review', 'changes_requested', 'confirmed', 'rejected', 'expired');
create type public.review_decision as enum ('approved', 'changes_requested', 'rejected');
create type public.goal_kind as enum ('reading', 'writing', 'drawing', 'cycling', 'running', 'walking', 'hiking', 'gym', 'place', 'study', 'sleep');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 20),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null check (char_length(name) between 2 and 40),
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8)),
  status public.room_status not null default 'recruiting',
  start_date date not null,
  planned_weeks smallint not null check (planned_weeks between 1 and 52),
  timezone text not null default 'Asia/Seoul',
  current_rule_version integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, user_id)
);

create table public.rule_versions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  version integer not null,
  goal_kind public.goal_kind not null,
  weekly_target integer not null check (weekly_target > 0),
  unit text not null,
  verification_note text not null default '',
  penalty_won integer not null default 0 check (penalty_won >= 0),
  rank_weights_bps integer[] not null,
  fee_bps integer not null default 100 check (fee_bps = 100),
  rules_hash text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (room_id, version),
  check (array_length(rank_weights_bps, 1) between 2 and 4)
);

create table public.rule_agreements (
  rule_version_id uuid not null references public.rule_versions(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  decision public.agreement_decision not null default 'pending',
  decided_at timestamptz,
  primary key (rule_version_id, user_id)
);

create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  rule_version_id uuid not null references public.rule_versions(id),
  week_no smallint not null check (week_no > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  finalized_at timestamptz,
  unique (room_id, week_no)
);

create table public.week_members (
  week_id uuid not null references public.weeks(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  rank_weight_bps integer not null check (rank_weight_bps between 0 and 10000),
  primary key (week_id, user_id)
);

create table public.records (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  owner_id uuid not null references public.profiles(id),
  kind public.goal_kind not null,
  current_version integer not null default 1,
  status public.record_status not null default 'draft',
  confirmed_value integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.record_versions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete cascade,
  version integer not null,
  measured_value integer not null default 0,
  note text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (record_id, version)
);

create table public.record_reviews (
  record_version_id uuid not null references public.record_versions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  decision public.review_decision not null,
  reason text,
  decided_at timestamptz not null default now(),
  primary key (record_version_id, reviewer_id)
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  record_version_id uuid not null references public.record_versions(id) on delete cascade,
  owner_id uuid not null references public.profiles(id),
  media_type text not null check (media_type in ('photo', 'video')),
  storage_key text,
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 2500),
  upload_status text not null default 'local_only' check (upload_status in ('local_only', 'queued', 'uploaded', 'failed')),
  created_at timestamptz not null default now()
);

create table public.extension_proposals (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  proposed_by uuid not null references public.profiles(id),
  added_weeks smallint not null check (added_weeks between 1 and 52),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'expired')),
  created_at timestamptz not null default now()
);

create table public.extension_votes (
  proposal_id uuid not null references public.extension_proposals(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  decision public.agreement_decision not null default 'pending',
  decided_at timestamptz,
  primary key (proposal_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.rule_versions enable row level security;
alter table public.rule_agreements enable row level security;
alter table public.weeks enable row level security;
alter table public.week_members enable row level security;
alter table public.records enable row level security;
alter table public.record_versions enable row level security;
alter table public.record_reviews enable row level security;
alter table public.media enable row level security;
alter table public.extension_proposals enable row level security;
alter table public.extension_votes enable row level security;

create policy "profiles are visible to signed-in users" on public.profiles for select to authenticated using (true);
create policy "users manage own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "members can read rooms" on public.rooms for select to authenticated using (exists (select 1 from public.room_members m where m.room_id = rooms.id and m.user_id = auth.uid() and m.left_at is null));
create policy "users can create owned rooms" on public.rooms for insert to authenticated with check (owner_id = auth.uid());
create policy "owners can update rooms" on public.rooms for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "members can read memberships" on public.room_members for select to authenticated using (exists (select 1 from public.room_members mine where mine.room_id = room_members.room_id and mine.user_id = auth.uid() and mine.left_at is null));
create policy "users can join themselves" on public.room_members for insert to authenticated with check (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nickname', '새 멤버'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
