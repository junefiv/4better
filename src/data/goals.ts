import { GoalKind, Route } from '../types/domain';
import { color, onChip } from '../design/tokens';

export type GoalTracking = 'count' | 'time' | 'activity' | 'location';

export interface GoalMeasureOption {
  id: string;
  unit: string;
  label: string;
}

export interface GoalGuide {
  title: string;
  formula: string;
  goal: string;
  rules: string[];
  rejected: string[];
  notes?: string[];
}

export const GOAL_DEFAULTS = {
  radius: 100,
  idleDuration: '3분',
  wakeWindow: 15,
  wakeSteps: 20,
} as const;

export const GOAL_PRESETS = [
  {
    id: 'reading',
    label: '독서',
    unit: '권',
    tracking: 'count',
    about: '독후감과 책을 든 사진이 모두 있어야 1권으로 인정돼요.',
    measures: [{ id: 'books', unit: '권', label: '권수' }],
    guide: {
      title: '독서 인정 기준',
      formula: '독후감 + 책을 든 사진 = 1권',
      goal: '주기별 독서 권수',
      rules: [
        '독후감 텍스트를 작성해요.',
        '읽은 책을 직접 들고 사진을 찍어요.',
        '두 가지가 모두 있어야 1권으로 인정돼요.',
      ],
      rejected: [
        '독후감이나 사진 중 하나가 없는 기록',
        '책 표지만 따로 찍은 사진',
        '이전에 제출한 사진을 다시 사용한 기록',
      ],
    },
  },
  {
    id: 'writing',
    label: '글쓰기',
    unit: '편',
    tracking: 'count',
    about: '텍스트 제출 1건이 1편이에요. 손글씨형은 사진으로 인증해요.',
    measures: [{ id: 'pieces', unit: '편', label: '편수' }],
    guide: {
      title: '글쓰기 인정 기준',
      formula: '글 1건 제출 = 1편',
      goal: '주기별 작성 편수',
      rules: [
        '카드를 만들 때 글 종류를 하나 골라요.',
        '일반 유형은 텍스트를 직접 입력해요.',
        '손글씨형은 작성한 글의 사진을 올려요.',
      ],
      rejected: [
        '내용이 없는 텍스트',
        '손글씨형에서 사진이 없는 기록',
        '이전에 제출한 글이나 사진을 다시 사용한 기록',
      ],
    },
  },
  {
    id: 'drawing',
    label: '그림',
    unit: '점',
    tracking: 'count',
    about: '완성한 작품 사진 1장이 1점으로 인정돼요.',
    measures: [{ id: 'works', unit: '점', label: '작품 수' }],
    guide: {
      title: '그림 인정 기준',
      formula: '작품 사진 1장 = 1점',
      goal: '주기별 작품 수',
      rules: [
        '완성한 작품이 보이는 사진을 올려요.',
        '유효한 작품 사진 1건이 1점으로 쌓여요.',
      ],
      rejected: [
        '작품이 보이지 않는 사진',
        '빈 종이나 빈 스케치북 사진',
        '이전에 제출한 사진을 다시 사용한 기록',
      ],
    },
  },
  {
    id: 'cycling',
    label: '자전거',
    unit: null,
    tracking: 'activity',
    about: '시작 버튼 이후의 거리 또는 시간 중 하나를 목표로 정해요.',
    measures: [
      { id: 'km', unit: 'km', label: '거리' },
      { id: 'minutes', unit: '분', label: '시간' },
    ],
    guide: {
      title: '자전거 인정 기준',
      formula: '시작 이후 이동한 거리 또는 시간',
      goal: '거리 또는 운동 시간',
      rules: [
        '출발할 때 시작 버튼을 눌러요.',
        '거리·시간·페이스가 함께 기록돼요.',
        '카드에서 선택한 거리 또는 시간만 목표에 반영돼요.',
      ],
      rejected: [
        '시작 버튼을 누르기 전의 이동',
        '이동 없이 기록만 실행한 활동',
        '정상적인 위치 이동이 확인되지 않는 기록',
      ],
      notes: [
        '버튼을 누르기 전의 이동은 포함되지 않아요.',
        '카드에서 선택한 거리 또는 시간만 달성률에 반영돼요.',
        '페이스와 경로는 기록용이며 목표량에는 들어가지 않아요.',
      ],
    },
  },
  {
    id: 'running',
    label: '러닝',
    unit: null,
    tracking: 'activity',
    about: '시작 버튼 이후의 거리 또는 시간 중 하나를 목표로 정해요.',
    measures: [
      { id: 'km', unit: 'km', label: '거리' },
      { id: 'minutes', unit: '분', label: '시간' },
    ],
    guide: {
      title: '러닝 인정 기준',
      formula: '시작 이후 달린 거리 또는 시간',
      goal: '거리 또는 운동 시간',
      rules: [
        '달리기 전에 시작 버튼을 눌러요.',
        '거리·시간·페이스가 함께 기록돼요.',
        '카드에서 선택한 기준만 목표에 반영돼요.',
      ],
      rejected: [
        '시작 버튼을 누르기 전의 활동',
        '위치 이동 없이 실행된 기록',
        '비정상적인 속도나 경로가 감지된 기록',
      ],
      notes: [
        '버튼을 누르기 전의 활동은 포함되지 않아요.',
        '카드에서 선택한 기준만 달성률에 반영돼요.',
        '멈춘 시간이 길면 실제 이동 구간과 구분해 기록해요.',
      ],
    },
  },
  {
    id: 'walking',
    label: '워킹',
    unit: null,
    tracking: 'activity',
    about: '거리·시간·걸음수 중 하나로 목표를 정하고 움직임을 기록해요.',
    measures: [
      { id: 'km', unit: 'km', label: '거리' },
      { id: 'minutes', unit: '분', label: '시간' },
      { id: 'steps', unit: '걸음', label: '걸음수' },
    ],
    guide: {
      title: '워킹 인정 기준',
      formula: '시작 이후 거리·시간·걸음수 기록',
      goal: '거리, 시간 또는 걸음수',
      rules: [
        '걷기 전에 시작 버튼을 눌러요.',
        '거리·시간·걸음수가 함께 기록돼요.',
        `걸음이 ${GOAL_DEFAULTS.idleDuration} 동안 늘지 않으면 시간이 멈춰요.`,
      ],
      rejected: [
        '시작 버튼을 누르기 전의 걸음',
        '움직임 없이 시간만 실행한 기록',
        '만보기 증가가 확인되지 않는 걷기 기록',
      ],
      notes: [
        '폰만 켜 둔 시간은 걷기 시간으로 인정되지 않아요.',
        '기록이 멈춘 뒤 걷기 시작하면 자동 재개 또는 재시작 안내가 나와요.',
      ],
    },
  },
  {
    id: 'place',
    label: '장소 방문',
    unit: null,
    tracking: 'location',
    about: '등록한 장소 안에서 시작해야 하며, 벗어나면 자동으로 종료돼요.',
    measures: [
      { id: 'visits', unit: '회', label: '방문 횟수' },
      { id: 'minutes', unit: '분', label: '체류 시간' },
    ],
    guide: {
      title: '장소 방문 인정 기준',
      formula: '등록 장소 안에서 시작 + 체류 = 방문 인정',
      goal: '방문 횟수 또는 체류 시간',
      rules: [
        '내가 방문할 장소를 지도에 한 번 등록해요.',
        `등록 위치 반경 ${GOAL_DEFAULTS.radius}m 안에서 체크를 시작해요.`,
        '반경을 벗어나면 기록이 자동으로 종료돼요.',
      ],
      rejected: [
        '등록한 장소 밖에서 시작한 기록',
        '시작 버튼을 누르지 않은 방문',
        '앱에 등록되지 않은 다른 장소 방문',
      ],
      notes: [
        '장소는 등록한 뒤 변경할 수 없어요.',
        '앱을 켜지 않고 방문한 활동은 나중에 추가할 수 없어요.',
      ],
    },
  },
  {
    id: 'study',
    label: '공부',
    unit: '분',
    tracking: 'time',
    about: '앱을 보고 있는 시간만 순공으로 쌓이고, 1시간마다 확인해요.',
    measures: [{ id: 'minutes', unit: '시간', label: '순공 시간' }],
    guide: {
      title: '공부 인정 기준',
      formula: '화면 유지 + 1시간마다 확인 = 순공 시간',
      goal: '순공 시간',
      rules: [
        '공부를 시작할 때 순공 타이머를 켜요.',
        '공부 화면이 보이는 동안만 시간이 쌓여요.',
        '1시간마다 화면을 터치해 계속 공부 중인지 확인해요.',
      ],
      rejected: [
        '앱을 내리거나 다른 화면을 연 시간',
        '타이머를 시작하지 않고 공부한 시간',
        '1시간 확인에 응답하지 않은 이후 시간',
      ],
      notes: [
        '백그라운드에서는 시간이 쌓이지 않아요.',
        '확인 요청에 응답하지 않으면 이후 시간은 기록되지 않아요.',
        '시험 시계는 편의 기능이며 순공 타이머와 함께 쓸 수 있어요.',
      ],
    },
  },
  {
    id: 'morning',
    label: '아침형 인간',
    unit: '일',
    tracking: 'count',
    about: '알람을 끈 뒤 제한 시간 안에 걸음 미션을 마쳐야 성공이에요.',
    measures: [{ id: 'wakes', unit: '일', label: '성공한 날' }],
    guide: {
      title: '아침형 인간 인정 기준',
      formula: '알람 종료 + 제한 시간 안에 걸음 미션',
      goal: '완전히 일어난 횟수',
      rules: [
        '설정된 시간에 울리는 알람을 직접 꺼요.',
        `알람 종료 후 ${GOAL_DEFAULTS.wakeWindow}분 안에 ${GOAL_DEFAULTS.wakeSteps}걸음을 걸어요.`,
        '걸음 미션까지 완료해야 성공으로 기록돼요.',
      ],
      rejected: [
        '알람만 끄고 걸음 미션을 하지 않은 경우',
        '제한 시간이 지난 뒤 걸음 수를 채운 경우',
        '알람이 아닌 일반 앱 실행으로 기록을 시작한 경우',
      ],
    },
  },
] as const satisfies ReadonlyArray<{
  id: GoalKind;
  label: string;
  unit: string | null;
  tracking: GoalTracking;
  about: string;
  measures: readonly GoalMeasureOption[];
  guide: GoalGuide;
}>;

export type LiveGoalKind = (typeof GOAL_PRESETS)[number]['id'];
export type QuickStartRoute = Extract<Route, 'submit' | 'timer' | 'capture' | 'morning'>;

export interface SessionQuickStart {
  actionLabel: string;
  hint: string;
  route: QuickStartRoute;
  startsSession: boolean;
}

const QUICK_START: Record<LiveGoalKind, SessionQuickStart> = {
  reading: { actionLabel: '독후감 올리기', hint: '독후감과 책을 든 사진이 있어야 읽은 것으로 봐요.', route: 'submit', startsSession: false },
  writing: { actionLabel: '글 올리기', hint: '텍스트로 체크해요. 손글씨형은 사진이 필요해요.', route: 'submit', startsSession: false },
  drawing: { actionLabel: '그림 인증', hint: '작품 사진이 있어야 그린 것으로 봐요.', route: 'submit', startsSession: false },
  place: { actionLabel: '체크 시작', hint: '등록한 장소 반경 안에서 시작하고, 정한 시간만큼 머무르면 인정돼요.', route: 'timer', startsSession: true },
  cycling: { actionLabel: '라이딩 시작', hint: '버튼을 누른 뒤부터 거리·페이스·시간을 세요.', route: 'timer', startsSession: true },
  running: { actionLabel: '러닝 시작', hint: '버튼을 누른 뒤부터 거리·페이스·시간을 세요.', route: 'timer', startsSession: true },
  walking: { actionLabel: '워킹 시작', hint: '버튼을 누른 뒤부터 거리·시간·걸음수를 세요.', route: 'timer', startsSession: true },
  study: { actionLabel: '순공 시작', hint: '앱을 벗어나면 멈추고, 1시간마다 화면을 터치해요.', route: 'timer', startsSession: true },
  morning: { actionLabel: '기상 체크', hint: '알람을 끈 뒤 제한 시간 안에 걸어야 일어난 것으로 봐요.', route: 'morning', startsSession: false },
};

export function sessionQuickStart(kind: string): SessionQuickStart {
  return QUICK_START[migrateGoalKind(kind)];
}

const PROGRESS_TITLE: Record<LiveGoalKind, string> = {
  reading: '읽은 책',
  writing: '올린 글',
  drawing: '작품',
  place: '방문',
  cycling: '라이딩',
  running: '러닝',
  walking: '워킹',
  study: '순공',
  morning: '기상',
};

export function sessionProgressTitle(kind: string) {
  return PROGRESS_TITLE[migrateGoalKind(kind)];
}

export function goalLabel(kind: string) {
  return goalPreset(kind).label;
}

export function goalPreset(kind: string) {
  const id = migrateGoalKind(kind);
  return GOAL_PRESETS.find((preset) => preset.id === id) ?? GOAL_PRESETS.find((preset) => preset.id === 'study')!;
}

export function goalMeasures(kind: string): GoalMeasureOption[] {
  return [...goalPreset(kind).measures];
}

export function isTimeUnit(unit: string) {
  return unit === '분' || unit === '시간';
}

export function isTimeGoal(kind: string, unit?: string) {
  if (unit) return isTimeUnit(unit);
  return goalPreset(kind).tracking === 'time';
}

export function persistTarget(raw: number, unit: string) {
  return unit === '시간' ? Math.round(raw * 60) : raw;
}

export function persistUnit(unit: string) {
  return unit === '시간' ? '분' : unit;
}

export function migrateGoalKind(kind: string): LiveGoalKind {
  if (kind === 'focus_timer') return 'study';
  if (kind === 'gym') return 'place';
  if (kind === 'hiking') return 'walking';
  if (kind === 'sleep') return 'morning';
  return GOAL_PRESETS.some((preset) => preset.id === kind) ? kind as LiveGoalKind : 'study';
}

const GOAL_CHIPS: Record<LiveGoalKind, string> = {
  reading: color.blue,
  study: color.blue,
  drawing: color.orange,
  writing: color.orange,
  cycling: color.lime,
  running: color.lime,
  walking: color.lime,
  place: color.aqua,
  morning: color.aqua,
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
