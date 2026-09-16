import { GoalKind, League, LeagueState, Member, RoundResult } from '../types/domain';
import { color } from '../design/tokens';
import { isTimeGoal, migrateGoalKind } from '../data/goals';
import { supabase } from './supabase';

const MEMBER_COLORS = [color.blue, color.orange, color.lime, color.aqua];

type RoomRow = {
  id: string;
  name: string;
  status: string;
  planned_weeks: number;
  start_date: string;
  created_at: string;
  owner_id: string;
  rule_versions: Array<{
    version: number;
    goal_kind: string;
    weekly_target: number;
    unit: string;
    penalty_won: number;
    rank_weights_bps: number[];
  }> | null;
  weeks: Array<{
    id: string;
    week_no: number;
    starts_at: string;
    ends_at: string;
    records: Array<{
      owner_id: string;
      status: string;
      confirmed_value: number;
    }> | null;
  }> | null;
  room_members: Array<{
    user_id: string;
    role: string;
    left_at: string | null;
  }> | null;
};

export function isRemoteLeague(league: League | null | undefined) {
  return Boolean(league?.weekId);
}

export function remoteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (message.includes('NOT_AUTHENTICATED')) return 'Google로 로그인한 뒤에 저장할 수 있어요.';
  if (message.includes('PROFILE_REQUIRED')) return '닉네임을 먼저 저장해 주세요.';
  if (message.includes('INVALID_NAME')) return '리그 이름은 2~40자로 입력해 주세요.';
  if (message.includes('INVALID_TARGET')) return '목표량을 다시 확인해 주세요.';
  if (message.includes('INVALID_WEEKS')) return '기간은 1~12주만 가능해요.';
  if (message.includes('WEEK_NOT_FOUND') || message.includes('NOT_A_MEMBER')) return '이 리그에서 체크할 수 없어요.';
  if (message.includes('TIMER_NOT_RUNNING')) return '진행 중인 타이머가 없어요.';
  if (message.includes('WEEK_FINALIZED')) return '이미 끝난 주차예요.';
  return message || '요청을 처리하지 못했어요.';
}

export async function fetchMyLeagues(userId: string): Promise<League[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      id, name, status, planned_weeks, start_date, created_at, owner_id,
      rule_versions (version, goal_kind, weekly_target, unit, penalty_won, rank_weights_bps),
      weeks (id, week_no, starts_at, ends_at, records (owner_id, status, confirmed_value)),
      room_members (user_id, role, left_at)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rooms = (data ?? []) as RoomRow[];
  const memberIds = [...new Set(rooms.flatMap((room) => (room.room_members ?? []).map((member) => member.user_id)))];
  const nicknames = new Map<string, string>();
  if (memberIds.length) {
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, nickname').in('id', memberIds);
    if (profileError) throw profileError;
    for (const profile of profiles ?? []) nicknames.set(profile.id, profile.nickname);
  }
  return rooms.map((room) => toLeague(room, userId, nicknames));
}

export async function createRemoteLeague(input: {
  name: string;
  kind: GoalKind;
  weeklyTarget: number;
  unit: string;
  plannedWeeks: number;
}) {
  if (!supabase) throw new Error('NOT_AUTHENTICATED');
  const { data, error } = await supabase.rpc('create_league', {
    p_name: input.name,
    p_goal_kind: input.kind,
    p_weekly_target: input.weeklyTarget,
    p_unit: input.unit,
    p_planned_weeks: input.plannedWeeks,
    p_penalty_won: 10000,
  });
  if (error) throw error;
  return String(data);
}

export async function submitRemoteCheck(weekId: string, value: number, note = '') {
  if (!supabase) throw new Error('NOT_AUTHENTICATED');
  const { data, error } = await supabase.rpc('submit_goal_check', {
    p_week_id: weekId,
    p_value: value,
    p_note: note,
  });
  if (error) throw error;
  return String(data);
}

export async function startRemoteTimer(weekId: string) {
  if (!supabase) throw new Error('NOT_AUTHENTICATED');
  const { data, error } = await supabase.rpc('start_timer_session', { p_week_id: weekId });
  if (error) throw error;
  return String(data);
}

export async function pauseRemoteTimer() {
  if (!supabase) throw new Error('NOT_AUTHENTICATED');
  const { data, error } = await supabase.rpc('pause_timer_session');
  if (error) throw error;
  return Number(data ?? 0);
}

export async function finishRemoteTimer(note = '') {
  if (!supabase) throw new Error('NOT_AUTHENTICATED');
  const { data, error } = await supabase.rpc('finish_timer_session', { p_note: note });
  if (error) throw error;
  return String(data);
}

export function createTargetValue(kind: GoalKind, raw: number) {
  return isTimeGoal(kind) ? Math.round(raw * 60) : raw;
}

function toLeague(room: RoomRow, userId: string, nicknames: Map<string, string>): League {
  const rule = [...(room.rule_versions ?? [])].sort((a, b) => b.version - a.version)[0];
  const weeks = [...(room.weeks ?? [])].sort((a, b) => a.week_no - b.week_no);
  const now = Date.now();
  const current = weeks.find((week) => new Date(week.starts_at).getTime() <= now && now < new Date(week.ends_at).getTime())
    ?? weeks[weeks.length - 1];
  const members = (room.room_members ?? [])
    .filter((member) => !member.left_at)
    .map((member, index) => toMember(member, userId, index, current?.records ?? [], nicknames));
  const me = members.find((member) => member.isMe) ?? members[0];
  const kind = migrateGoalKind(rule?.goal_kind ?? 'study');
  const weekNo = current?.week_no ?? 1;
  return {
    id: room.id,
    name: room.name,
    kind,
    week: weekNo,
    weekId: current?.id,
    totalWeeks: room.planned_weeks,
    target: rule?.weekly_target ?? 1,
    unit: rule?.unit ?? (isTimeGoal(kind) ? '분' : '회'),
    confirmed: me?.confirmed ?? 0,
    pending: me?.pending ?? 0,
    deadlineLabel: current ? deadlineLabel(current.ends_at) : '이번 주',
    state: roomState(room.status, weekNo, room.planned_weeks),
    members,
    rounds: weeks.map((week) => toRound(week)),
    penaltyWon: rule?.penalty_won ?? 10000,
    rankWeights: (rule?.rank_weights_bps ?? [4500, 3000, 2000, 500]).map((value) => Math.round(value / 100)),
  };
}

function toMember(
  member: NonNullable<RoomRow['room_members']>[number],
  userId: string,
  index: number,
  records: NonNullable<NonNullable<RoomRow['weeks']>[number]['records']>,
  nicknames: Map<string, string>,
): Member {
  const name = nicknames.get(member.user_id) ?? '멤버';
  const mine = records.filter((record) => record.owner_id === member.user_id);
  return {
    id: member.user_id,
    name,
    initials: name.slice(0, 1),
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
    confirmed: mine.filter((record) => record.status === 'confirmed').reduce((sum, record) => sum + record.confirmed_value, 0),
    pending: mine.filter((record) => record.status === 'pending_review' || record.status === 'changes_requested').length,
    isMe: member.user_id === userId,
  };
}

function toRound(week: NonNullable<RoomRow['weeks']>[number]): RoundResult {
  const confirmed: Record<string, number> = {};
  for (const record of week.records ?? []) {
    if (record.status !== 'confirmed') continue;
    confirmed[record.owner_id] = (confirmed[record.owner_id] ?? 0) + record.confirmed_value;
  }
  return { week: week.week_no, confirmed };
}

function roomState(status: string, week: number, totalWeeks: number): LeagueState {
  if (status === 'completed' || status === 'archived') return 'completed';
  if (status === 'recruiting' || status === 'agreement_pending') return 'waiting';
  if (status === 'extension_pending' || week >= totalWeeks) return 'last_week';
  return 'active';
}

function deadlineLabel(endsAt: string) {
  const days = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return '이번 주 마감';
  if (days === 1) return '오늘 마감';
  return `이번 주 마감까지 ${days}일`;
}
