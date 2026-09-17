import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, Camera, Check, ChevronRight, Clock3, MessageCircleQuestion, RotateCcw } from 'lucide-react-native';
import { GoalRecord, League, Member } from '../types/domain';
import { color, leagueCard, onChip, radius, space, typography } from '../design/tokens';
import { goalChip, goalLabel, sessionQuickStart } from '../data/goals';
import { StatusBadge } from './ui';
import { leagueRounds, RoundTable } from './RoundTable';

function mineWeekProgress(league: League, week: number) {
  const rounds = leagueRounds(league);
  const round = rounds.find((item) => item.week === week) ?? rounds[0];
  if (!round || !league.target) return 0;
  const member = league.members.find((item) => item.isMe) ?? league.members.find((item) => item.id === 'me');
  if (!member) return 0;
  const value = round.confirmed[member.id] ?? 0;
  return Math.min(100, Math.round((value / league.target) * 100));
}

export function LeagueCard({ league, onPress, onStart }: { league: League; onPress: () => void; onStart?: () => void }) {
  const [week, setWeek] = useState(league.week);
  const start = sessionQuickStart(league.kind);
  const startable = Boolean(onStart) && (league.state === 'active' || league.state === 'last_week');
  const chip = goalChip(league.kind);
  const progress = useMemo(() => mineWeekProgress(league, week), [league, week]);

  return (
    <View style={styles.league}>
      <View style={styles.metaRow}>
        <View style={[styles.categoryPill, { backgroundColor: chip.soft }]}>
          <View style={[styles.categoryDot, { backgroundColor: chip.fill }]} />
          <Text style={[styles.categoryText, { color: chip.fill }]}>{goalLabel(league.kind)}</Text>
        </View>
        <Text style={styles.weekMeta}>{week}주차 / 총 {league.totalWeeks}주</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${league.name} 리그 열기`}
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Text style={styles.leagueName} numberOfLines={2}>{league.name}</Text>
      </Pressable>

      <View style={styles.graphBlock}>
        <View style={styles.graphHead}>
          <Text style={[styles.achievement, { color: chip.fill }]}>{progress}%</Text>
        </View>
        <RoundTable league={league} onWeekChange={setWeek} mineOnly visual="card" />
      </View>

      {startable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${league.name} ${start.actionLabel}`}
          onPress={onStart}
          style={({ pressed }) => [styles.quickStart, pressed && styles.pressed]}
        >
          <Text style={styles.quickStartText}>{start.actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function MemberProgress({ member, target, unit }: { member: Member; target: number; unit: string }) {
  const percent = Math.min(100, Math.round((member.confirmed / target) * 100));
  return <View style={styles.member}><View style={[styles.avatar, { backgroundColor: member.color }]}><Text style={[styles.initial, { color: onChip(member.color) }]}>{member.initials}</Text></View><View style={styles.flex}><View style={styles.between}><Text style={styles.name}>{member.isMe ? `${member.name} · 나` : member.name}</Text><Text style={styles.value}>{percent}%</Text></View><View style={styles.bar}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: member.color }]} /></View></View></View>;
}

export function ConfirmationRow({ record, onOpen, onRetry }: { record: GoalRecord; onOpen: () => void; onRetry?: () => void }) {
  const isFailed = record.state === 'upload_failed';
  return <Pressable accessibilityRole="button" onPress={isFailed && onRetry ? onRetry : onOpen} style={({ pressed }) => [styles.confirmation, pressed && styles.pressed]}><View style={styles.flex}><View style={styles.between}><Text style={styles.name}>{record.ownerName} · {record.value}{record.unit}</Text>{isFailed ? <StatusBadge label="업로드 실패" tone="danger" icon={AlertCircle} /> : <StatusBadge label={`${record.reviewTotal}명 중 ${record.reviewed}명 확인`} tone="warning" icon={Clock3} />}</View><Text numberOfLines={2} style={styles.note}>{record.note || '설명이 아직 없어요.'}</Text><Text style={styles.meta}>{isFailed ? '탭해서 다시 시도' : `${record.submittedAt} · 내 확인이 필요해요`}</Text></View>{isFailed ? <RotateCcw size={19} color={color.danger} /> : <ChevronRight size={19} color={color.inkMuted} />}</Pressable>;
}

export function RecapPreview({ hasMedia, onPress }: { hasMedia: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.recap, pressed && styles.pressed]}>{hasMedia ? <Image source={{ uri: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=70' }} style={styles.recapImage} /> : <View style={styles.recapEmpty}><Camera size={25} color={color.blue} /><Text style={styles.recapEmptyText}>이번 주 첫 순간을 남겨보세요</Text></View>}<View style={styles.recapCopy}><Text style={styles.recapTitle}>이번 주, 우리가 만든 장면</Text><Text style={styles.recapMeta}>{hasMedia ? '확정 기록 5개 · 영상 8초' : '확정된 기록만 비공개 리캡에 들어가요'}</Text><View style={styles.recapLink}><Text style={styles.recapLinkText}>{hasMedia ? '리캡 보기' : '촬영하기'}</Text><ChevronRight size={16} color={color.ink} /></View></View></Pressable>;
}

export function ReviewActions({ onApprove, onQuestion, onReject }: { onApprove: () => void; onQuestion: () => void; onReject: () => void }) {
  return <View style={styles.reviewActions}><Pressable accessibilityRole="button" accessibilityLabel="기록 승인" onPress={onApprove} style={({ pressed }) => [styles.reviewPrimary, pressed && styles.pressed]}><Check size={18} color={color.ink} /><Text style={styles.reviewPrimaryText}>승인</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="설명 요청" onPress={onQuestion} style={({ pressed }) => [styles.reviewSecondary, pressed && styles.pressed]}><MessageCircleQuestion size={18} color={color.blue} /><Text style={styles.reviewSecondaryText}>설명 요청</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="기록 미인정" onPress={onReject} style={({ pressed }) => [styles.reject, pressed && styles.pressed]}><Text style={styles.rejectText}>미인정</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.x2 },
  member: { flexDirection: 'row', alignItems: 'center', gap: space.x3, paddingVertical: space.x2 }, avatar: { width: 34, height: 34, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' }, initial: { color: color.ink, ...typography.label }, name: { color: color.ink, ...typography.label }, value: { color: color.inkMuted, ...typography.caption }, bar: { height: 5, backgroundColor: color.surfaceMuted, borderRadius: 3, overflow: 'hidden', marginTop: 7 }, fill: { height: '100%', backgroundColor: color.blue, borderRadius: 3 },
  confirmation: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: space.x3, paddingVertical: space.x4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.borderSubtle }, note: { color: color.inkMuted, ...typography.body, marginTop: 4 }, meta: { color: color.orange, ...typography.caption, marginTop: 4 },
  recap: { borderRadius: radius.league, overflow: 'hidden', backgroundColor: color.surface, borderWidth: 1, borderColor: color.borderSubtle }, recapImage: { width: '100%', height: 156 }, recapEmpty: { height: 140, backgroundColor: color.aquaSoft, justifyContent: 'center', alignItems: 'center', gap: space.x2 }, recapEmptyText: { color: color.ink, ...typography.label }, recapCopy: { padding: space.x4 }, recapTitle: { color: color.ink, ...typography.sectionTitle }, recapMeta: { color: color.inkMuted, ...typography.caption, marginTop: 4 }, recapLink: { flexDirection: 'row', alignItems: 'center', marginTop: space.x3 }, recapLinkText: { color: color.ink, ...typography.label },
  reviewActions: { gap: space.x2 }, reviewPrimary: { minHeight: 52, borderRadius: radius.input, backgroundColor: color.lime, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.x2 }, reviewPrimaryText: { color: color.ink, ...typography.button }, reviewSecondary: { minHeight: 48, borderRadius: radius.input, borderWidth: 1, borderColor: color.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.x2 }, reviewSecondaryText: { color: color.ink, ...typography.button }, reject: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, rejectText: { color: color.danger, ...typography.button }, pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  league: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderSubtle,
    borderRadius: leagueCard.radius,
    padding: leagueCard.padding,
    gap: leagueCard.gapTight,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.x3 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.round, flexShrink: 1 },
  categoryDot: { width: 7, height: 7, borderRadius: 4 },
  categoryText: { ...typography.chip },
  weekMeta: { color: color.inkMuted, ...typography.label, flexShrink: 0 },
  leagueName: { color: color.ink, ...typography.cardTitle },
  graphBlock: { gap: leagueCard.gapTight, marginTop: leagueCard.gapLoose - leagueCard.gapTight },
  graphHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end' },
  achievement: { ...typography.cardAchievement },
  quickStart: {
    minHeight: leagueCard.ctaHeight,
    borderRadius: radius.input,
    backgroundColor: leagueCard.ctaBackground,
    paddingHorizontal: space.x4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: leagueCard.gapLoose - leagueCard.gapTight,
  },
  quickStartText: { color: leagueCard.ctaForeground, ...typography.cardCta },
});
