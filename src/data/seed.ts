import { AppSnapshot } from '../types/domain';
import { color } from '../design/tokens';

export const initialSnapshot: AppSnapshot = {
  nickname: '다솜',
  signedIn: false,
  pushEnabled: false,
  blockedUsers: [],
  offline: false,
  timerStartedAt: null,
  timerAccumulatedSeconds: 40 * 60,
  timerRunning: false,
  league: {
    id: 'preview-league',
    name: '퇴근 후 집중 클럽',
    kind: 'focus_timer',
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
      { id: 'me', name: '다솜', initials: '다', color: color.primary, confirmed: 400, pending: 80, isMe: true },
      { id: 'jun', name: '준호', initials: '준', color: color.secondary, confirmed: 520, pending: 0 },
      { id: 'so', name: '소연', initials: '소', color: '#F2C66D', confirmed: 610, pending: 0 },
      { id: 'min', name: '민재', initials: '민', color: '#AAB8CD', confirmed: 310, pending: 45 },
    ],
  },
  records: [
    { id: 'r1', ownerId: 'so', ownerName: '소연', kind: 'focus_timer', value: 75, unit: '분', note: '도서관에서 논문 읽기', version: 1, state: 'pending', reviewed: 2, reviewTotal: 3, submittedAt: '오늘 13:40' },
    { id: 'r2', ownerId: 'me', ownerName: '다솜', kind: 'focus_timer', value: 80, unit: '분', note: '기획서 정리', version: 2, state: 'pending', reviewed: 1, reviewTotal: 3, submittedAt: '어제 21:18' },
    { id: 'r3', ownerId: 'jun', ownerName: '준호', kind: 'writing', value: 1, unit: '회', note: '초고 2장', version: 1, state: 'changes_requested', reviewed: 2, reviewTotal: 3, submittedAt: '월요일 22:10' },
  ],
};
