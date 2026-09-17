export type RankCount = 2 | 3 | 4;
export type RankStyle = 'balanced' | 'winner' | 'even';

export const RANK_STEP = 5;
export const RANK_MIN = 5;
export const RANK_EXAMPLE_PENALTY = 10000;
export const RANK_FEE_RATE = 0.01;

export const RANK_STYLE_PRESETS: Record<RankStyle, Record<RankCount, number[]>> = {
  balanced: { 2: [70, 30], 3: [50, 30, 20], 4: [45, 30, 20, 5] },
  winner: { 2: [80, 20], 3: [60, 25, 15], 4: [60, 25, 10, 5] },
  even: { 2: [50, 50], 3: [40, 30, 30], 4: [25, 25, 25, 25] },
};

export const DEFAULT_RANK_WEIGHTS = RANK_STYLE_PRESETS.balanced[4];

export function rankPreset(style: RankStyle, count: RankCount) {
  return [...RANK_STYLE_PRESETS[style][count]];
}

export function matchRankStyle(weights: number[]): RankStyle | null {
  const count = weights.length;
  if (count !== 2 && count !== 3 && count !== 4) return null;
  for (const style of ['balanced', 'winner', 'even'] as const) {
    const preset = RANK_STYLE_PRESETS[style][count];
    if (preset.every((value, index) => value === weights[index])) return style;
  }
  return null;
}

export function nudgeRank(weights: number[], index: number, delta: number) {
  if (!delta) return null;
  const next = [...weights];
  if (delta > 0) {
    for (let i = next.length - 1; i >= 0; i -= 1) {
      if (i === index || next[i] < RANK_MIN + RANK_STEP) continue;
      next[i] -= RANK_STEP;
      next[index] += RANK_STEP;
      return next;
    }
    return null;
  }
  if (next[index] <= RANK_MIN) return null;
  for (let i = next.length - 1; i >= 0; i -= 1) {
    if (i === index) continue;
    next[index] -= RANK_STEP;
    next[i] += RANK_STEP;
    return next;
  }
  return null;
}

export function dividerStops(weights: number[]) {
  const stops: number[] = [];
  let total = 0;
  for (let index = 0; index < weights.length - 1; index += 1) {
    total += weights[index];
    stops.push(total);
  }
  return stops;
}

export function nearestDivider(weights: number[], percent: number) {
  const stops = dividerStops(weights);
  let best = 0;
  let distance = Number.POSITIVE_INFINITY;
  stops.forEach((stop, index) => {
    const next = Math.abs(stop - percent);
    if (next < distance) {
      best = index;
      distance = next;
    }
  });
  return best;
}

export function moveRankDivider(weights: number[], dividerIndex: number, leftPercent: number) {
  const pair = weights[dividerIndex] + weights[dividerIndex + 1];
  const snapped = Math.round(leftPercent / RANK_STEP) * RANK_STEP;
  const left = Math.min(pair - RANK_MIN, Math.max(RANK_MIN, snapped));
  const next = [...weights];
  next[dividerIndex] = left;
  next[dividerIndex + 1] = pair - left;
  return next;
}

export function toRankBps(weights: number[]) {
  return weights.map((value) => value * 100);
}

export function examplePayout(weight: number, penalty = RANK_EXAMPLE_PENALTY) {
  const pot = penalty - Math.round(penalty * RANK_FEE_RATE);
  return Math.round(pot * weight / 100);
}

export function isValidRankSplit(weights: number[]) {
  return weights.length >= 2 && weights.length <= 4
    && weights.every((value) => value >= RANK_MIN)
    && weights.reduce((sum, value) => sum + value, 0) === 100;
}
