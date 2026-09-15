export type GoalKind = 'focus_timer' | 'writing' | 'drawing';
export type LeagueState = 'none' | 'agreement' | 'waiting' | 'active' | 'last_week' | 'completed';
export type RecordState = 'draft' | 'pending' | 'changes_requested' | 'confirmed' | 'rejected' | 'upload_failed';
export type ReviewDecision = 'approved' | 'changes_requested' | 'rejected';
export type Route = 'auth' | 'home' | 'league' | 'create' | 'join' | 'agreement' | 'timer' | 'submit' | 'reviews' | 'results' | 'recap' | 'capture' | 'extension' | 'profile' | 'admin' | 'states';

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  confirmed: number;
  pending: number;
  isMe?: boolean;
}

export interface League {
  id: string;
  name: string;
  kind: GoalKind;
  week: number;
  totalWeeks: number;
  target: number;
  unit: string;
  confirmed: number;
  pending: number;
  deadlineLabel: string;
  state: LeagueState;
  members: Member[];
  penaltyWon: number;
  rankWeights: number[];
}

export interface GoalRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  kind: GoalKind;
  value: number;
  unit: string;
  note: string;
  version: number;
  state: RecordState;
  reviewed: number;
  reviewTotal: number;
  submittedAt: string;
}

export interface AppSnapshot {
  nickname: string;
  signedIn: boolean;
  pushEnabled: boolean;
  blockedUsers: string[];
  league: League | null;
  records: GoalRecord[];
  timerStartedAt: string | null;
  timerAccumulatedSeconds: number;
  timerRunning: boolean;
  offline: boolean;
}
