import { StyleSheet, Text, View } from 'react-native';
import { GoalKind, League, RoundResult } from '../types/domain';
import { color, radius, space, typography } from '../design/tokens';
import { goalChip, migrateGoalKind } from '../data/goals';
import { formatMinutes, formatValue, rideFromMinutes, stayFromVisits } from '../lib/format';

export function SessionRound({ league, round, mineOnly, visual = 'default' }: { league: League; round: RoundResult; mineOnly: boolean; visual?: 'default' | 'card' }) {
  const kind = migrateGoalKind(league.kind);
  const members = visibleMembers(league, mineOnly);
  if (mineOnly) {
    const member = members[0];
    if (!member) return null;
    return <GaugeBoard kind={kind} league={league} value={round.confirmed[member.id] ?? 0} compact={false} visual={visual} />;
  }
  return (
    <View style={styles.team}>
      {members.map((member) => (
        <View key={`${round.week}-${member.id}`} style={styles.teamBlock}>
          <View style={styles.teamHead}>
            <Text style={[styles.teamName, member.isMe && styles.me]}>{member.isMe ? '나' : member.name}</Text>
            <Text style={styles.teamMeta}>{teamMeta(kind, league, round.confirmed[member.id] ?? 0)}</Text>
          </View>
          <GaugeBoard kind={kind} league={league} value={round.confirmed[member.id] ?? 0} compact visual={visual} />
        </View>
      ))}
    </View>
  );
}

function visibleMembers(league: League, mineOnly: boolean) {
  if (!mineOnly) return league.members;
  const mine = league.members.find((member) => member.isMe) ?? league.members.find((member) => member.id === 'me');
  return mine ? [mine] : [];
}

function teamMeta(kind: GoalKind, league: League, value: number) {
  if (kind === 'reading') return `${value}/${league.target}권`;
  if (kind === 'writing') return `${value}/${league.target}편`;
  if (kind === 'drawing') return `${value}/${league.target}점`;
  if (kind === 'place') return `${value}회 · ${formatMinutes(stayFromVisits(value).minutes)}`;
  if (kind === 'walking' && league.unit === '걸음') return `${value.toLocaleString()}걸음`;
  if (kind === 'morning' || kind === 'sleep') return `${value}/${league.target}일`;
  if (kind === 'cycling' || kind === 'running') {
    const ride = league.unit === '분' ? rideFromMinutes(value) : { km: value, minutes: Math.round(value * 5) };
    return `${ride.km}km · ${formatMinutes(ride.minutes)}`;
  }
  return formatValue(value, league.unit);
}

function GaugeBoard({ kind, league, value, compact, visual }: { kind: GoalKind; league: League; value: number; compact: boolean; visual: 'default' | 'card' }) {
  const chip = goalChip(kind);
  const graphLabel = visual === 'card' ? styles.cardGraphLabel : styles.graphLabel;
  if (kind === 'study') return <StudyGauge minutes={value} targetMinutes={league.target} compact={compact} accent={chip.fill} />;
  if (kind === 'reading') return <TileGauge count={league.target} filled={value} compact={compact} empty="책" accent={chip.fill} graphLabel={graphLabel} />;
  if (kind === 'writing') return <TileGauge count={league.target} filled={value} compact={compact} empty="글" accent={chip.fill} graphLabel={graphLabel} />;
  if (kind === 'drawing') return <TileGauge count={Math.min(league.target, 8)} filled={value} compact={compact} empty="작품" wrap accent={chip.fill} graphLabel={graphLabel} />;
  if (kind === 'place') return <CheckpointGauge visits={value} target={league.target} compact={compact} accent={chip.fill} />;
  if (kind === 'walking') {
    return (
      <FillBarGauge
        progress={league.target ? Math.min(1, value / league.target) : 0}
        label={league.unit === '걸음' ? `${value.toLocaleString()}걸음` : formatValue(value, league.unit)}
        compact={compact}
        accent={chip.fill}
        graphLabel={graphLabel}
      />
    );
  }
  if (kind === 'cycling' || kind === 'running' || kind === 'hiking') {
    const ride = league.unit === '분' ? rideFromMinutes(value) : { km: value, minutes: Math.round(value * 5), pace: 5 };
    const progress = league.target ? Math.min(1, value / league.target) : 0;
    return (
      <View style={styles.stack}>
        <FillBarGauge progress={progress} label={`${ride.km}km`} compact={compact} path accent={chip.fill} graphLabel={graphLabel} />
        {compact || visual === 'card' ? null : <Text style={styles.metaCaption}>{formatMinutes(ride.minutes)} · {ride.pace ? `${ride.pace.toFixed(1)}분/km` : ''}</Text>}
      </View>
    );
  }
  if (kind === 'morning' || kind === 'sleep') return <TileGauge count={Math.max(1, league.target)} filled={value} compact={compact} empty="기상" round accent={chip.fill} graphLabel={graphLabel} />;
  return (
    <FillBarGauge
      progress={league.target ? Math.min(1, value / league.target) : 0}
      label={formatValue(value, league.unit)}
      compact={compact}
      accent={chip.fill}
      graphLabel={graphLabel}
    />
  );
}

function StudyGauge({ minutes, targetMinutes, compact, accent }: { minutes: number; targetMinutes: number; compact: boolean; accent: string }) {
  const hours = Math.max(1, Math.ceil(targetMinutes / 60));
  const rowH = compact ? 44 : 88;
  return (
    <View style={styles.stack}>
      <View style={[styles.studyRow, { height: rowH }]}>
        {Array.from({ length: hours }, (_, index) => {
          const spent = Math.max(0, Math.min(60, minutes - index * 60));
          const fillH = (spent / 60) * rowH;
          return (
            <View key={index} style={[styles.hourCell, { height: rowH }]}>
              <View style={[styles.hourFill, { height: fillH, backgroundColor: accent }]} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TileGauge({ count, filled, compact, empty, accent, round = false, wrap = false, graphLabel }: { count: number; filled: number; compact: boolean; empty: string; accent: string; round?: boolean; wrap?: boolean; graphLabel: { color: string } }) {
  const cells = Math.max(1, count);
  return (
    <View style={[wrap ? styles.tileGrid : styles.tileRow, compact && (wrap ? styles.tileGridCompact : styles.tileRowCompact)]}>
      {Array.from({ length: cells }, (_, index) => {
        const on = index < filled;
        return (
          <View
            key={index}
            style={[
              styles.tile,
              wrap && styles.tileWrap,
              compact && styles.tileCompact,
              wrap && compact && styles.tileWrapCompact,
              round && styles.tileRound,
              !on && styles.tileEmpty,
              on && { borderWidth: 2, borderColor: accent, backgroundColor: accent },
            ]}
          >
            {!on ? <Text style={[graphLabel, styles.tileHintColor]}>{empty}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function CheckpointGauge({ visits, target, compact, accent }: { visits: number; target: number; compact: boolean; accent: string }) {
  const cells = Math.max(1, target);
  return (
    <View style={[styles.pathWrap, compact && styles.pathWrapCompact]}>
      <View style={[styles.pathLine, { backgroundColor: accent }]} />
      <View style={[styles.tileRow, compact && styles.tileRowCompact]}>
        {Array.from({ length: cells }, (_, index) => {
          const on = index < visits;
          return (
            <View
              key={index}
              style={[
                styles.check,
                compact && styles.checkCompact,
                !on && styles.tileEmpty,
                on && { borderWidth: 2, borderColor: accent, backgroundColor: accent },
              ]}
            >
              {!on ? <View style={[styles.node, { backgroundColor: accent }]} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function FillBarGauge({ progress, label, compact, accent, path = false, graphLabel }: { progress: number; label: string; compact: boolean; accent: string; path?: boolean; graphLabel: { color: string } }) {
  const fillWidth = `${Math.max(0, Math.min(100, progress * 100))}%` as `${number}%`;
  const onFill = progress >= 0.35;
  return (
    <View style={[styles.bar, compact && styles.barCompact, path && styles.barPath]}>
      <View style={[styles.barFill, { width: fillWidth, backgroundColor: accent }]} />
      <View style={[styles.barGoal, { backgroundColor: accent }]} />
      <Text style={[graphLabel, styles.barLabel, onFill ? styles.barLabelOnFill : styles.barLabelOnTrack]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 6 },
  metaCaption: { color: color.inkMuted, ...typography.caption },
  team: { gap: space.x3 },
  teamBlock: { gap: 6 },
  teamHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  teamName: { color: color.ink, ...typography.label },
  me: { ...typography.label },
  teamMeta: { color: color.inkMuted, ...typography.caption },
  studyRow: { flexDirection: 'row', width: '100%', gap: 3 },
  hourCell: { flex: 1, backgroundColor: color.surfaceMuted, borderRadius: 5, overflow: 'hidden', justifyContent: 'flex-end' },
  hourFill: { width: '100%', overflow: 'hidden' },
  tileRow: { flexDirection: 'row', width: '100%', height: 72, gap: 6 },
  tileRowCompact: { height: 40, gap: 4 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: 6 },
  tileGridCompact: { gap: 4 },
  tile: { flex: 1, borderRadius: radius.control, overflow: 'hidden', backgroundColor: color.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  tileWrap: { flexGrow: 0, flexShrink: 0, flexBasis: '48%', height: 88 },
  tileWrapCompact: { height: 52, flexBasis: '48%' },
  tileCompact: { borderRadius: 6 },
  tileRound: { borderRadius: 999 },
  tileEmpty: { borderWidth: 1, borderColor: color.borderSubtle },
  graphLabel: { color: color.inkMuted, ...typography.label },
  cardGraphLabel: { color: color.inkMuted, ...typography.cardGraphLabel },
  tileHintColor: { color: color.inkMuted },
  pathWrap: { width: '100%', height: 72, justifyContent: 'center' },
  pathWrapCompact: { height: 40 },
  pathLine: { position: 'absolute', left: 16, right: 16, height: 2, backgroundColor: color.borderSubtle },
  check: { flex: 1, height: 72, borderRadius: radius.round, overflow: 'hidden', backgroundColor: color.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  checkCompact: { height: 40 },
  node: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.borderSubtle },
  bar: { width: '100%', height: 56, borderRadius: radius.input, backgroundColor: color.surfaceMuted, overflow: 'hidden', justifyContent: 'center' },
  barCompact: { height: 36 },
  barPath: { borderRadius: 999 },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  barGoal: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 2 },
  barLabel: { paddingHorizontal: space.x3, zIndex: 1 },
  barLabelOnTrack: { color: color.ink },
  barLabelOnFill: { color: color.white, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 4 },
});
