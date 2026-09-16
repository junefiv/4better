import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, Camera, Check, ChevronRight, Clock3, MessageCircleQuestion, RotateCcw } from 'lucide-react-native';
import { GoalRecord, League, Member } from '../types/domain';
import { color, onChip, radius, space, type } from '../design/tokens';
import { goalChip, goalLabel, sessionQuickStart } from '../data/goals';
import { StatusBadge } from './ui';
import { RoundMeta, RoundTable } from './RoundTable';

export function LeagueCard({ league, onPress, onStart }: { league: League; onPress: () => void; onStart?: () => void }) {
  const [week, setWeek] = useState(league.week);
  const start = sessionQuickStart(league.kind);
  const startable = Boolean(onStart) && (league.state === 'active' || league.state === 'last_week');
  return (
    <View style={styles.league}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${goalLabel(league.kind)} ${league.name} 리그 열기`} onPress={onPress} style={({ pressed }) => [styles.titleRow, pressed && styles.pressed]}>
        <View style={[styles.goalBadge, { backgroundColor: goalChip(league.kind).soft }]}><Text style={styles.goalBadgeText}>{goalLabel(league.kind)}</Text></View>
        <Text style={styles.leagueName} numberOfLines={1}>{league.name}</Text>
        <RoundMeta league={league} week={week} />
      </Pressable>
      <RoundTable league={league} onWeekChange={setWeek} mineOnly />
      {startable ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${league.name} ${start.actionLabel}`} onPress={onStart} style={({ pressed }) => [styles.quickStart, pressed && styles.pressed]}>
          <Text style={styles.quickStartText}>{start.actionLabel}</Text>
          <ChevronRight size={18} color={color.white} strokeWidth={2.4} />
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
  member: { flexDirection: 'row', alignItems: 'center', gap: space.x3, paddingVertical: space.x2 }, avatar: { width: 34, height: 34, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' }, initial: { color: color.ink, fontSize: 12, fontWeight: '800' }, name: { color: color.ink, ...type.label }, value: { color: color.inkMuted, ...type.caption }, bar: { height: 5, backgroundColor: color.surfaceMuted, borderRadius: 3, overflow: 'hidden', marginTop: 7 }, fill: { height: '100%', backgroundColor: color.blue, borderRadius: 3 },
  confirmation: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: space.x3, paddingVertical: space.x4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.borderSubtle }, note: { color: color.inkMuted, ...type.body, marginTop: 4 }, meta: { color: color.orange, ...type.caption, marginTop: 4 },
  recap: { borderRadius: radius.league, overflow: 'hidden', backgroundColor: color.surface, borderWidth: 1, borderColor: color.borderSubtle }, recapImage: { width: '100%', height: 156 }, recapEmpty: { height: 140, backgroundColor: color.aquaSoft, justifyContent: 'center', alignItems: 'center', gap: space.x2 }, recapEmptyText: { color: color.ink, ...type.label }, recapCopy: { padding: space.x4 }, recapTitle: { color: color.ink, ...type.heading }, recapMeta: { color: color.inkMuted, ...type.caption, marginTop: 4 }, recapLink: { flexDirection: 'row', alignItems: 'center', marginTop: space.x3 }, recapLinkText: { color: color.ink, ...type.label },
  reviewActions: { gap: space.x2 }, reviewPrimary: { minHeight: 52, borderRadius: radius.input, backgroundColor: color.lime, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.x2 }, reviewPrimaryText: { color: color.ink, ...type.label }, reviewSecondary: { minHeight: 48, borderRadius: radius.input, borderWidth: 1, borderColor: color.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.x2 }, reviewSecondaryText: { color: color.ink, ...type.label }, reject: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, rejectText: { color: color.danger, ...type.label }, pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  league: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.borderSubtle, borderRadius: radius.league, padding: space.x5, gap: space.x3 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.x2 }, goalBadge: { backgroundColor: color.blueSoft, borderRadius: radius.control, paddingHorizontal: 8, paddingVertical: 5 }, goalBadgeText: { color: color.ink, ...type.caption, fontWeight: '800' }, leagueName: { flex: 1, minWidth: 0, color: color.ink, ...type.heading },
  quickStart: { minHeight: 48, borderRadius: radius.input, backgroundColor: color.orange, paddingHorizontal: space.x4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.x1 },
  quickStartText: { color: color.white, ...type.label },
});
