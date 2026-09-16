import { AppSnapshot, League } from '../types/domain';
import { color } from '../design/tokens';
import { migrateGoalKind } from './goals';

const chip = {
  me: color.orange,
  jun: color.aqua,
  so: color.lime,
  min: color.blue,
} as const;

export const previewActiveLeague: League = {
  id: 'preview-league',
  name: '퇴근 후 집중 클럽',
  kind: 'study',
  week: 3,
  totalWeeks: 4,
  target: 600,
  unit: '분',
  confirmed: 400,
  pending: 80,
  deadlineLabel: '이번 주 마감까지 2일',
  state: 'active',
  penaltyWon: 10000,
  rankWeights: [45, 30, 20, 5],
  members: [
    { id: 'me', name: '다솜', initials: '다', color: chip.me, confirmed: 400, pending: 80, isMe: true },
    { id: 'jun', name: '준호', initials: '준', color: chip.jun, confirmed: 520, pending: 0 },
    { id: 'so', name: '소연', initials: '소', color: chip.so, confirmed: 610, pending: 0 },
    { id: 'min', name: '민재', initials: '민', color: chip.min, confirmed: 310, pending: 45 },
  ],
  rounds: [
    { week: 1, confirmed: { me: 620, jun: 540, so: 600, min: 410 } },
    { week: 2, confirmed: { me: 480, jun: 600, so: 510, min: 360 } },
    { week: 3, confirmed: { me: 400, jun: 520, so: 610, min: 310 } },
  ],
};

export const previewReadingLeague: League = {
  id: 'preview-league-reading',
  name: '주말 독서 모임',
  kind: 'reading',
  week: 2,
  totalWeeks: 4,
  target: 2,
  unit: '권',
  confirmed: 1,
  pending: 0,
  deadlineLabel: '이번 주 마감까지 4일',
  state: 'active',
  penaltyWon: 10000,
  rankWeights: [45, 30, 20, 5],
  members: [
    { id: 'me', name: '다솜', initials: '다', color: chip.me, confirmed: 1, pending: 0, isMe: true },
    { id: 'jun', name: '준호', initials: '준', color: chip.jun, confirmed: 1, pending: 0 },
    { id: 'so', name: '소연', initials: '소', color: chip.so, confirmed: 2, pending: 0 },
  ],
  rounds: [
    { week: 1, confirmed: { me: 1, jun: 1, so: 1 } },
    { week: 2, confirmed: { me: 1, jun: 1, so: 2 } },
  ],
};

export const previewWalkingLeague: League = {
  id: 'preview-league-walking',
  name: '한강 저녁 워킹',
  kind: 'walking',
  week: 1,
  totalWeeks: 4,
  target: 8000,
  unit: '걸음',
  confirmed: 3200,
  pending: 0,
  deadlineLabel: '오늘 마감까지 8시간',
  state: 'active',
  penaltyWon: 10000,
  rankWeights: [45, 30, 20, 5],
  members: [
    { id: 'me', name: '다솜', initials: '다', color: chip.me, confirmed: 3200, pending: 0, isMe: true },
    { id: 'min', name: '민재', initials: '민', color: chip.min, confirmed: 5100, pending: 0 },
  ],
  rounds: [
    { week: 1, confirmed: { me: 3200, min: 5100 } },
  ],
};

export const previewPlaceLeague: League = {
  id: 'preview-league-place',
  name: '독서실 출석',
  kind: 'place',
  week: 1,
  totalWeeks: 4,
  target: 4,
  unit: '회',
  confirmed: 2,
  pending: 0,
  deadlineLabel: '이번 주 4회',
  state: 'active',
  penaltyWon: 10000,
  rankWeights: [45, 30, 20, 5],
  members: [
    { id: 'me', name: '다솜', initials: '다', color: chip.me, confirmed: 2, pending: 0, isMe: true },
    { id: 'so', name: '소연', initials: '소', color: chip.so, confirmed: 3, pending: 0 },
  ],
  rounds: [{ week: 1, confirmed: { me: 2, so: 3 } }],
};

export const previewCyclingLeague: League = {
  id: 'preview-league-cycling',
  name: '한강 라이딩',
  kind: 'cycling',
  week: 1,
  totalWeeks: 4,
  target: 90,
  unit: '분',
  confirmed: 48,
  pending: 0,
  deadlineLabel: '오늘 저녁까지',
  state: 'active',
  penaltyWon: 10000,
  rankWeights: [45, 30, 20, 5],
  members: [
    { id: 'me', name: '다솜', initials: '다', color: chip.me, confirmed: 48, pending: 0, isMe: true },
    { id: 'jun', name: '준호', initials: '준', color: chip.jun, confirmed: 70, pending: 0 },
  ],
  rounds: [{ week: 1, confirmed: { me: 48, jun: 70 } }],
};

export const previewMorningLeague: League = {
  id: 'preview-league-morning',
  name: '7시 기상',
  kind: 'sleep',
  week: 1,
  totalWeeks: 4,
  target: 5,
  unit: '회',
  confirmed: 3,
  pending: 0,
  deadlineLabel: '내일 07:00',
  state: 'active',
  penaltyWon: 10000,
  rankWeights: [45, 30, 20, 5],
  members: [
    { id: 'me', name: '다솜', initials: '다', color: chip.me, confirmed: 3, pending: 0, isMe: true },
    { id: 'min', name: '민재', initials: '민', color: chip.min, confirmed: 4, pending: 0 },
  ],
  rounds: [{ week: 1, confirmed: { me: 3, min: 4 } }],
};

export const previewDrawingLeague: League = {
  id: 'preview-league-drawing',
  name: '저녁 크로키',
  kind: 'drawing',
  week: 1,
  totalWeeks: 4,
  target: 4,
  unit: '점',
  confirmed: 2,
  pending: 0,
  deadlineLabel: '이번 주 4점',
  state: 'active',
  penaltyWon: 10000,
  rankWeights: [45, 30, 20, 5],
  members: [
    { id: 'me', name: '다솜', initials: '다', color: chip.me, confirmed: 2, pending: 0, isMe: true },
    { id: 'so', name: '소연', initials: '소', color: chip.so, confirmed: 3, pending: 0 },
  ],
  rounds: [{ week: 1, confirmed: { me: 2, so: 3 } }],
};

export const previewEndedLeague: League = {
  id: 'preview-league-ended',
  name: '아침 글쓰기 리그',
  kind: 'writing',
  week: 4,
  totalWeeks: 4,
  target: 5,
  unit: '회',
  confirmed: 5,
  pending: 0,
  deadlineLabel: '4주 완료',
  state: 'completed',
  penaltyWon: 10000,
  rankWeights: [45, 30, 20, 5],
  members: [
    { id: 'me', name: '다솜', initials: '다', color: chip.me, confirmed: 5, pending: 0, isMe: true },
    { id: 'jun', name: '준호', initials: '준', color: chip.jun, confirmed: 4, pending: 0 },
    { id: 'so', name: '소연', initials: '소', color: chip.so, confirmed: 5, pending: 0 },
  ],
  rounds: [
    { week: 1, confirmed: { me: 4, jun: 5, so: 3 } },
    { week: 2, confirmed: { me: 5, jun: 3, so: 5 } },
    { week: 3, confirmed: { me: 5, jun: 5, so: 4 } },
    { week: 4, confirmed: { me: 5, jun: 4, so: 5 } },
  ],
};

export const initialSnapshot: AppSnapshot = {
  nickname: '다솜',
  signedIn: false,
  pushEnabled: false,
  blockedUsers: [],
  offline: false,
  timerStartedAt: null,
  timerAccumulatedSeconds: 40 * 60,
  timerRunning: false,
  league: previewActiveLeague,
  leagues: [previewActiveLeague, previewReadingLeague, previewWalkingLeague, previewPlaceLeague, previewCyclingLeague, previewMorningLeague, previewDrawingLeague, previewEndedLeague],
  records: [
    { id: 'r1', ownerId: 'so', ownerName: '소연', kind: 'study', value: 75, unit: '분', note: '도서관에서 논문 읽기', version: 1, state: 'pending', reviewed: 2, reviewTotal: 3, submittedAt: '오늘 13:40' },
    { id: 'r2', ownerId: 'me', ownerName: '다솜', kind: 'study', value: 80, unit: '분', note: '기획서 정리', version: 2, state: 'pending', reviewed: 1, reviewTotal: 3, submittedAt: '어제 21:18' },
    { id: 'r3', ownerId: 'jun', ownerName: '준호', kind: 'writing', value: 1, unit: '회', note: '초고 2장', version: 1, state: 'changes_requested', reviewed: 2, reviewTotal: 3, submittedAt: '월요일 22:10' },
  ],
};

export function isLeagueActive(league: League) {
  return league.state !== 'completed';
}

function withMigratedKind<T extends { kind: string }>(item: T): T {
  return { ...item, kind: migrateGoalKind(item.kind) };
}

function sampleRoundsFor(league: League) {
  if (league.id === previewActiveLeague.id) return previewActiveLeague.rounds;
  if (league.id === previewReadingLeague.id) return previewReadingLeague.rounds;
  if (league.id === previewWalkingLeague.id) return previewWalkingLeague.rounds;
  if (league.id === previewPlaceLeague.id) return previewPlaceLeague.rounds;
  if (league.id === previewCyclingLeague.id) return previewCyclingLeague.rounds;
  if (league.id === previewMorningLeague.id) return previewMorningLeague.rounds;
  if (league.id === previewDrawingLeague.id) return previewDrawingLeague.rounds;
  if (league.id === previewEndedLeague.id) return previewEndedLeague.rounds;
  return undefined;
}

export function withLeagueRounds(league: League): League {
  const needed = Math.max(1, league.week);
  const sample = sampleRoundsFor(league);
  if (sample && sample.length >= needed) return { ...league, rounds: sample };
  const byWeek = new Map((league.rounds ?? sample ?? []).map((round) => [round.week, round]));
  const rounds = Array.from({ length: needed }, (_, index) => {
    const week = index + 1;
    const existing = byWeek.get(week);
    if (existing) return existing;
    if (week === league.week) {
      return { week, confirmed: Object.fromEntries(league.members.map((member) => [member.id, member.confirmed])) };
    }
    return {
      week,
      confirmed: Object.fromEntries(league.members.map((member, memberIndex) => [
        member.id,
        Math.round(league.target * Math.min(1, 0.42 + ((week + memberIndex) % 5) * 0.13)),
      ])),
    };
  });
  return { ...league, rounds };
}

export function normalizeSnapshot(snapshot: AppSnapshot): AppSnapshot {
  const leagues = (snapshot.leagues?.length
    ? snapshot.leagues
    : snapshot.league
      ? [snapshot.league]
      : []).map(withMigratedKind).map(withLeagueRounds);
  const extras = [previewReadingLeague, previewWalkingLeague, previewPlaceLeague, previewCyclingLeague, previewMorningLeague, previewDrawingLeague]
    .filter((item) => !leagues.some((league) => league.id === item.id))
    .map(withLeagueRounds);
  const merged = [...leagues, ...extras];
  const hasEnded = merged.some((league) => league.state === 'completed');
  const nextLeagues = hasEnded ? merged : [...merged, withLeagueRounds(previewEndedLeague)];
  const selected = snapshot.league ? withLeagueRounds(withMigratedKind(snapshot.league)) : null;
  return {
    ...snapshot,
    records: snapshot.records.map(withMigratedKind),
    leagues: nextLeagues,
    league: selected ?? nextLeagues.find(isLeagueActive) ?? nextLeagues[0] ?? null,
  };
}
