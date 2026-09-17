-- 방장이 정한 순위 분배율을 create_league에 넘깁니다.
-- 기존 6인자 함수를 교체하므로 한 번에 실행하세요.

drop function if exists public.create_league(text, public.goal_kind, integer, text, smallint, integer);

create or replace function public.create_league(
  p_name text,
  p_goal_kind public.goal_kind,
  p_weekly_target integer,
  p_unit text,
  p_planned_weeks smallint,
  p_penalty_won integer default 10000,
  p_rank_weights_bps integer[] default array[4500, 3000, 2000, 500]
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_room uuid;
  v_rule uuid;
  v_week uuid;
  v_start date;
  v_starts timestamptz;
  v_ends timestamptz;
  v_name text := trim(p_name);
  v_kind public.goal_kind := case when p_goal_kind::text = 'focus_timer' then 'study'::public.goal_kind else p_goal_kind end;
  v_ranks integer[] := p_rank_weights_bps;
begin
  if v_user is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 40 then raise exception 'INVALID_NAME'; end if;
  if p_weekly_target is null or p_weekly_target <= 0 then raise exception 'INVALID_TARGET'; end if;
  if p_planned_weeks is null or p_planned_weeks < 1 or p_planned_weeks > 12 then raise exception 'INVALID_WEEKS'; end if;
  if p_penalty_won is null or p_penalty_won < 0 then raise exception 'INVALID_PENALTY'; end if;
  if v_ranks is null
    or array_length(v_ranks, 1) is null
    or array_length(v_ranks, 1) < 2
    or array_length(v_ranks, 1) > 4
    or exists (select 1 from unnest(v_ranks) as w(value) where value is null or value < 500)
    or (select sum(value) from unnest(v_ranks) as w(value)) <> 10000
  then
    raise exception 'INVALID_RANK_WEIGHTS';
  end if;
  if not exists (select 1 from public.profiles where id = v_user) then raise exception 'PROFILE_REQUIRED'; end if;

  v_start := (timezone('Asia/Seoul', now()))::date;
  v_starts := v_start::timestamp at time zone 'Asia/Seoul';
  v_ends := v_starts + interval '7 days';

  insert into public.rooms (owner_id, name, status, start_date, planned_weeks, current_rule_version)
  values (v_user, v_name, 'active', v_start, p_planned_weeks, 1)
  returning id into v_room;

  insert into public.room_members (room_id, user_id, role)
  values (v_room, v_user, 'owner');

  insert into public.rule_versions (
    room_id, version, goal_kind, weekly_target, unit, penalty_won,
    rank_weights_bps, fee_bps, rules_hash, created_by
  ) values (
    v_room, 1, v_kind, p_weekly_target, p_unit, p_penalty_won,
    v_ranks, 100,
    md5(v_room::text || v_kind::text || p_weekly_target::text || p_unit || p_planned_weeks::text || v_ranks::text),
    v_user
  ) returning id into v_rule;

  insert into public.rule_agreements (rule_version_id, user_id, decision, decided_at)
  values (v_rule, v_user, 'agreed', now());

  insert into public.weeks (room_id, rule_version_id, week_no, starts_at, ends_at)
  values (v_room, v_rule, 1, v_starts, v_ends)
  returning id into v_week;

  insert into public.week_members (week_id, user_id, rank_weight_bps)
  values (v_week, v_user, v_ranks[1]);

  return v_room;
end;
$function$;

grant execute on function public.create_league(text, public.goal_kind, integer, text, smallint, integer, integer[]) to authenticated;
grant execute on function public.create_league(text, public.goal_kind, integer, text, smallint, integer, integer[]) to service_role;
