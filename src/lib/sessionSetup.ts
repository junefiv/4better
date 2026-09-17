import { GOAL_DEFAULTS, GoalMeasureOption, goalMeasures, goalPreset, isTimeUnit } from '../data/goals';

export type CheckPeriod = 'day' | 'week' | 'month';

export const CHECK_PERIODS: { id: CheckPeriod; label: string; per: string }[] = [
  { id: 'day', label: '하루', per: '하루에' },
  { id: 'week', label: '한 주', per: '한 주에' },
  { id: 'month', label: '한 달', per: '한 달에' },
];

export const WRITING_TYPES = [
  { id: 'blog', label: '블로그형' },
  { id: 'insta', label: '인스타형' },
  { id: 'poem', label: '시' },
  { id: 'free', label: '자유형' },
  { id: 'hand', label: '손글씨형' },
] as const;

export const WAKE_HOURS = [5, 6, 7, 8, 9, 10];
export const WAKE_MINUTES = [0, 10, 20, 30, 40, 50];

export function setupMeasure(kind: string, period: CheckPeriod, measureId: string): GoalMeasureOption {
  const measure = goalMeasures(kind).find((item) => item.id === measureId) ?? goalMeasures(kind)[0];
  if (goalPreset(kind).id === 'study') return { ...measure, unit: '시간' };
  if (isTimeUnit(measure.unit) && period !== 'day') return { ...measure, unit: '시간', label: '시간' };
  return measure;
}

export function defaultTarget(kind: string, period: CheckPeriod, measureId: string) {
  const id = goalPreset(kind).id;
  const measure = setupMeasure(kind, period, measureId).id;
  const table: Record<string, Record<string, Record<CheckPeriod, number>>> = {
    reading: { books: { day: 1, week: 2, month: 4 } },
    writing: { pieces: { day: 1, week: 3, month: 8 } },
    drawing: { works: { day: 1, week: 3, month: 8 } },
    place: { visits: { day: 1, week: 3, month: 8 }, minutes: { day: 60, week: 3, month: 8 } },
    cycling: { km: { day: 10, week: 30, month: 80 }, minutes: { day: 40, week: 2, month: 6 } },
    running: { km: { day: 5, week: 20, month: 60 }, minutes: { day: 30, week: 2, month: 6 } },
    walking: { km: { day: 3, week: 15, month: 40 }, minutes: { day: 30, week: 3, month: 8 }, steps: { day: 8000, week: 40000, month: 120000 } },
    study: { minutes: { day: 2, week: 10, month: 30 } },
    morning: { wakes: { day: 1, week: 5, month: 20 } },
  };
  return table[id]?.[measure]?.[period] ?? 1;
}

export function targetRange(kind: string, period: CheckPeriod, measureId: string) {
  const measure = setupMeasure(kind, period, measureId);
  if (goalPreset(kind).id === 'morning') {
    if (period === 'day') return { min: 1, max: 1, step: 1 };
    if (period === 'week') return { min: 1, max: 7, step: 1 };
    return { min: 1, max: 31, step: 1 };
  }
  if (measure.unit === '걸음') return { min: 1000, max: period === 'day' ? 30000 : period === 'week' ? 120000 : 400000, step: 1000 };
  if (measure.unit === 'km') return { min: 1, max: period === 'day' ? 80 : period === 'week' ? 200 : 600, step: 1 };
  if (measure.unit === '시간') return { min: 1, max: period === 'day' ? 12 : period === 'week' ? 40 : 120, step: 1 };
  if (measure.unit === '분') return { min: 10, max: 180, step: 10 };
  return { min: 1, max: period === 'day' ? 3 : period === 'week' ? 14 : 40, step: 1 };
}

export function targetPresets(kind: string, period: CheckPeriod, measureId: string) {
  const id = goalPreset(kind).id;
  const measure = setupMeasure(kind, period, measureId);
  if (id === 'morning' && period === 'week') return [
    { value: 5, label: '주중 5일' },
    { value: 6, label: '6일' },
    { value: 7, label: '매일' },
  ];
  if (id === 'morning' && period === 'month') return [
    { value: 12, label: '주 3일' },
    { value: 20, label: '주중' },
    { value: 31, label: '매일' },
  ];
  if (measure.unit === '걸음' && period === 'day') return [
    { value: 6000, label: '6천' },
    { value: 8000, label: '8천' },
    { value: 10000, label: '1만' },
  ];
  if (id === 'study' && period === 'week') return [
    { value: 5, label: '5시간' },
    { value: 10, label: '10시간' },
    { value: 15, label: '15시간' },
  ];
  return [];
}

export function targetLabel(kind: string, period: CheckPeriod, measureId: string) {
  const per = CHECK_PERIODS.find((item) => item.id === period)?.per ?? '한 주에';
  const id = goalPreset(kind).id;
  const measure = setupMeasure(kind, period, measureId);
  if (id === 'morning') return period === 'day' ? '그날의 기상' : `${per} 성공할 날`;
  if (id === 'reading') return `${per} 읽을 권수`;
  if (id === 'writing') return `${per} 쓸 편수`;
  if (id === 'drawing') return `${per} 완성할 작품`;
  if (id === 'study') return `${per} 순공`;
  if (id === 'place' && measure.id === 'visits') return `${per} 방문`;
  if (id === 'place') return `${per} 머무를 시간`;
  if (measure.unit === 'km') return `${per} 이동 거리`;
  if (measure.unit === '걸음') return `${per} 걸음`;
  return `${per} 운동 시간`;
}

export function setupHint(kind: string, period: CheckPeriod, measureId: string) {
  const id = goalPreset(kind).id;
  const measure = setupMeasure(kind, period, measureId);
  if (id === 'morning') {
    return period === 'day'
      ? `알람을 끈 뒤 ${GOAL_DEFAULTS.wakeWindow}분 안에 ${GOAL_DEFAULTS.wakeSteps}걸음을 걸으면 그날 성공이에요.`
      : `하루 한 번만 셀 수 있어요. 알람만 끄고 다시 누우면 성공이 아니에요.`;
  }
  if (id === 'reading') return '독후감과 책을 든 사진이 있는 제출만 1권이에요.';
  if (id === 'writing') return '손글씨형은 사진이 필요하고, 나머지는 텍스트만 올리면 돼요.';
  if (id === 'drawing') return '작품이 보이는 사진 한 장이 1점이에요.';
  if (id === 'place') return '방문할 장소는 멤버가 나중에 지도에서 한 번만 찍어요. 찍으면 바꿀 수 없어요.';
  if (id === 'study') return '공부 화면을 보고 있는 시간만 쌓여요. 1시간마다 화면을 터치해요.';
  if (measure.unit === '걸음') return '시작 버튼을 누른 뒤 만보기가 늘어난 걸음만 넣어요.';
  return '시작 버튼을 누른 뒤의 기록만 넣어요. 페이스는 참고용이에요.';
}

export function formatWakeTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function hidesTargetStepper(kind: string, period: CheckPeriod) {
  return goalPreset(kind).id === 'morning' && period === 'day';
}
