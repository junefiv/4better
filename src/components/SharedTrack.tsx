import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check, Clock3, Flag } from 'lucide-react-native';
import { color, radius, space, type } from '../design/tokens';
import { Member } from '../types/domain';

export function SharedTrack({ members, target, unit, week, totalWeeks }: { members: Member[]; target: number; unit: string; week: number; totalWeeks: number }) {
  const marks = useMemo(() => members.map((member) => ({ ...member, ratio: Math.min(1, member.confirmed / target) })), [members, target]);
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`${week}주차 참여자 진행 상황`} style={styles.wrap}>
      <View style={styles.header}><Text style={styles.round}>라운드 {week} / {totalWeeks}</Text><View style={styles.goal}><Flag size={14} color={color.inkMuted} /><Text style={styles.goalText}>목표 {formatValue(target, unit)}</Text></View></View>
      <View style={styles.trackArea}>
        <View style={styles.line} />
        <View style={styles.finish}><Flag size={15} color={color.leagueDark} /><Text style={styles.finishText}>목표선</Text></View>
        {marks.map((member, index) => {
          const left = `${Math.max(2, Math.min(92, member.ratio * 90))}%` as `${number}%`;
          const lane = index % 2 === 0 ? 10 : 96;
          return (
            <View key={member.id} style={[styles.marker, { left, top: lane }]}>
              <View style={[styles.avatar, { backgroundColor: member.color }, member.pending > 0 && styles.pendingAvatar]}><Text style={styles.initial}>{member.initials}</Text>{member.confirmed >= target ? <View style={styles.complete}><Check size={9} color={color.white} strokeWidth={3} /></View> : null}</View>
              <Text numberOfLines={1} style={[styles.name, member.isMe && styles.me]}>{member.isMe ? '나' : member.name}</Text>
              {member.pending > 0 ? <View style={styles.pending}><Clock3 size={10} color={color.warning} /><Text style={styles.pendingText}>+{formatValue(member.pending, unit)} 확인 중</Text></View> : null}
            </View>
          );
        })}
      </View>
      <View style={styles.legend}><Text style={styles.legendText}>0</Text><Text style={styles.legendText}>{formatValue(Math.round(target / 2), unit)}</Text><Text style={styles.legendText}>{formatValue(target, unit)}</Text></View>
    </View>
  );
}

export function formatValue(value: number, unit: string) {
  if (unit === '분') return value >= 60 ? `${Math.floor(value / 60)}시간 ${value % 60 ? `${value % 60}분` : ''}`.trim() : `${value}분`;
  return `${value.toLocaleString()}${unit}`;
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: color.secondarySoft, borderRadius: radius.card, padding: space.x4, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  round: { color: color.leagueDark, ...type.label },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 5 }, goalText: { color: color.inkMuted, ...type.caption },
  trackArea: { height: 176, marginTop: space.x3 },
  line: { position: 'absolute', left: 10, right: 22, top: 82, height: 4, borderRadius: 2, backgroundColor: color.leagueDark },
  finish: { position: 'absolute', right: 0, top: 58, alignItems: 'center' }, finishText: { color: color.leagueDark, fontSize: 10, fontWeight: '700' },
  marker: { position: 'absolute', width: 82, marginLeft: -26, alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: radius.round, borderWidth: 2, borderColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  pendingAvatar: { borderStyle: 'dashed', borderColor: color.warning }, initial: { color: color.ink, fontSize: 12, fontWeight: '800' },
  complete: { position: 'absolute', width: 15, height: 15, borderRadius: 8, backgroundColor: color.success, right: -4, top: -4, alignItems: 'center', justifyContent: 'center' },
  name: { color: color.inkMuted, fontSize: 11, marginTop: 2, maxWidth: 64 }, me: { color: color.ink, fontWeight: '800' },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 2 }, pendingText: { color: color.warning, fontSize: 9, fontWeight: '700' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 16, marginTop: -4 }, legendText: { color: color.inkMuted, fontSize: 10 },
});
