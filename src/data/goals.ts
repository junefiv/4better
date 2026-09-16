import { GoalKind, Route } from '../types/domain';
import { color, onChip } from '../design/tokens';

export const GOAL_PRESETS = [
  { id: 'reading', label: '독서', unit: '회', tracking: 'count' },
  { id: 'writing', label: '글쓰기', unit: '회', tracking: 'count' },
  { id: 'drawing', label: '그림', unit: '회', tracking: 'count' },
  { id: 'cycling', label: '자전거', unit: '분', tracking: 'time' },
  { id: 'running', label: '러닝', unit: '분', tracking: 'time' },
  { id: 'walking', label: '워킹', unit: '분', tracking: 'time' },
  { id: 'hiking', label: '등산', unit: '분', tracking: 'time' },
  { id: 'gym', label: '헬스', unit: '분', tracking: 'time' },
  { id: 'place', label: '장소 방문', unit: '회', tracking: 'count' },
  { id: 'study', label: '공부', unit: '분', tracking: 'time' },
  { id: 'sleep', label: '아침형 인간', unit: '회', tracking: 'count' },
] as const satisfies ReadonlyArray<{ id: GoalKind; label: string; unit: string; tracking: 'time' | 'count' }>;

export type QuickStartRoute = Extract<Route, 'submit' | 'timer' | 'capture' | 'morning'>;

export interface SessionQuickStart {
  actionLabel: string;
  hint: string;
  route: QuickStartRoute;
  startsSession: boolean;
}

const QUICK_START: Record<GoalKind, SessionQuickStart> = {
  reading: { actionLabel: '독후감 올리기', hint: '독후감과 책을 든 사진이 있어야 읽은 것으로 봐요.', route: 'submit', startsSession: false },
  writing: { actionLabel: '글 올리기', hint: '텍스트로 체크해요. 손글씨형은 사진이 필요해요.', route: 'submit', startsSession: false },
  drawing: { actionLabel: '그림 인증', hint: '작품 사진이 있어야 그린 것으로 봐요.', route: 'submit', startsSession: false },
  place: { actionLabel: '방문 체크 시작', hint: '내가 찍은 장소 반경 안에서만 시작돼요.', route: 'timer', startsSession: true },
  cycling: { actionLabel: '라이딩 시작', hint: '버튼을 누른 뒤부터 거리·페이스·시간을 세요.', route: 'timer', startsSession: true },
  running: { actionLabel: '러닝 시작', hint: '버튼을 누른 뒤부터 거리·페이스·시간을 세요.', route: 'timer', startsSession: true },
  walking: { actionLabel: '워킹 시작', hint: '버튼을 누른 뒤부터 거리·시간·걸음수를 세요.', route: 'timer', startsSession: true },
  hiking: { actionLabel: '워킹 시작', hint: '등산은 더 이상 쓰지 않아요. 워킹으로 시작해요.', route: 'timer', startsSession: true },
  gym: { actionLabel: '방문 체크 시작', hint: '헬스는 장소 방문으로 체크해요.', route: 'timer', startsSession: true },
  study: { actionLabel: '순공 시작', hint: '앱을 벗어나면 멈추고, 1시간마다 화면을 터치해요.', route: 'timer', startsSession: true },
  sleep: { actionLabel: '기상 체크', hint: '알람을 끈 뒤 걸어야 일어난 것으로 봐요.', route: 'morning', startsSession: false },
};

export function sessionQuickStart(kind: string): SessionQuickStart {
  return QUICK_START[migrateGoalKind(kind)];
}

const PROGRESS_TITLE: Record<GoalKind, string> = {
  reading: '읽은 책',
  writing: '올린 글',
  drawing: '작품',
  place: '방문',
  cycling: '라이딩',
  running: '러닝',
  walking: '워킹',
  hiking: '워킹',
  gym: '방문',
  study: '순공',
  sleep: '기상',
};

export function sessionProgressTitle(kind: string) {
  return PROGRESS_TITLE[migrateGoalKind(kind)];
}

const labels: Record<string, string> = Object.fromEntries(GOAL_PRESETS.map((preset) => [preset.id, preset.label]));
labels.focus_timer = '공부';

export function goalLabel(kind: string) {
  return labels[kind] ?? '목표';
}

export function goalPreset(kind: string) {
  return GOAL_PRESETS.find((preset) => preset.id === kind) ?? GOAL_PRESETS.find((preset) => preset.id === 'study')!;
}

export function isTimeGoal(kind: string) {
  return goalPreset(kind).tracking === 'time';
}

export function migrateGoalKind(kind: string): GoalKind {
  if (kind === 'focus_timer') return 'study';
  return GOAL_PRESETS.some((preset) => preset.id === kind) ? kind as GoalKind : 'study';
}

const GOAL_CHIPS: Record<GoalKind, string> = {
  study: color.blue,
  reading: color.lime,
  writing: color.orange,
  drawing: color.aqua,
  walking: color.lime,
  cycling: color.aqua,
  running: color.orange,
  hiking: color.lime,
  place: color.orange,
  gym: color.orange,
  sleep: color.blue,
};

const GOAL_SOFT: Record<string, string> = {
  [color.blue]: color.blueSoft,
  [color.orange]: color.orangeSoft,
  [color.lime]: color.limeSoft,
  [color.aqua]: color.aquaSoft,
};

export function goalChip(kind: string) {
  const fill = GOAL_CHIPS[migrateGoalKind(kind)];
  return { fill, soft: GOAL_SOFT[fill], on: onChip(fill) };
}
