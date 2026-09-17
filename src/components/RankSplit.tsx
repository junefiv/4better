import { useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { color, radius, space, typography } from '../design/tokens';
import {
  DEFAULT_RANK_WEIGHTS,
  RANK_EXAMPLE_PENALTY,
  RANK_MIN,
  RANK_STEP,
  RankCount,
  RankStyle,
  dividerStops,
  examplePayout,
  matchRankStyle,
  moveRankDivider,
  nearestDivider,
  rankPreset,
} from '../lib/rankSplit';

const RANK_COLORS = [color.blue, color.aqua, color.lime, color.orange];
const HANDLE_WIDTH = 28;
const COUNT_OPTIONS: { id: RankCount; label: string }[] = [
  { id: 2, label: '2명' },
  { id: 3, label: '3명' },
  { id: 4, label: '4명' },
];
const STYLE_OPTIONS: { id: RankStyle; label: string }[] = [
  { id: 'balanced', label: '기본' },
  { id: 'winner', label: '1등 많이' },
  { id: 'even', label: '고르게' },
];

export function RankSplitEditor({ value = DEFAULT_RANK_WEIGHTS, onChange }: { value: number[]; onChange: (next: number[]) => void }) {
  const count = value.length as RankCount;
  const style = matchRankStyle(value);
  const setCount = (next: RankCount) => onChange(rankPreset(style ?? 'balanced', next));
  const setStyle = (next: RankStyle) => onChange(rankPreset(next, count));
  const [trackWidth, setTrackWidth] = useState(0);
  const [activeDivider, setActiveDivider] = useState<number | null>(null);
  const stageRef = useRef<View>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const originX = useRef(0);
  const widthRef = useRef(0);
  const drag = useRef<{ divider: number; start: number[] } | null>(null);
  valueRef.current = value;
  onChangeRef.current = onChange;

  const applyMove = (pageX: number) => {
    const session = drag.current;
    const width = widthRef.current;
    if (!session || width <= 0) return;
    const percent = Math.min(100, Math.max(0, (pageX - originX.current) / width * 100));
    const pairStart = session.start.slice(0, session.divider).reduce((sum, item) => sum + item, 0);
    const next = moveRankDivider(session.start, session.divider, percent - pairStart);
    if (next.join() !== valueRef.current.join()) {
      void Haptics.selectionAsync();
      onChangeRef.current(next);
    }
  };

  const beginDrag = (pageX: number) => {
    const weights = valueRef.current;
    const width = widthRef.current;
    if (width <= 0 || weights.length < 2) return;
    const percent = Math.min(100, Math.max(0, (pageX - originX.current) / width * 100));
    const divider = nearestDivider(weights, percent);
    drag.current = { divider, start: [...weights] };
    setActiveDivider(divider);
    applyMove(pageX);
  };

  const locate = (after?: () => void) => {
    stageRef.current?.measureInWindow((x, _y, width) => {
      originX.current = x;
      if (width) {
        widthRef.current = width;
        setTrackWidth(width);
      }
      after?.();
    });
  };

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (event: GestureResponderEvent) => {
      const pageX = event.nativeEvent.pageX;
      locate(() => beginDrag(pageX));
    },
    onPanResponderMove: (event: GestureResponderEvent) => applyMove(event.nativeEvent.pageX),
    onPanResponderRelease: () => {
      drag.current = null;
      setActiveDivider(null);
    },
    onPanResponderTerminate: () => {
      drag.current = null;
      setActiveDivider(null);
    },
  }), []);

  const stops = dividerStops(value);

  return (
    <View style={styles.wrap}>
      <View>
        <Text style={styles.title}>순위별 분배</Text>
        <Text style={styles.caption}>칸막이를 밀어 나눠요. 5% 단위로 맞춰지고, 한 등수는 최소 {RANK_MIN}%예요.</Text>
      </View>
      <View style={styles.chips}>
        {COUNT_OPTIONS.map((item) => (
          <Chip key={item.id} active={count === item.id} label={item.label} onPress={() => setCount(item.id)} />
        ))}
      </View>
      <View style={styles.chips}>
        {STYLE_OPTIONS.map((item) => (
          <Chip key={item.id} active={style === item.id} label={item.label} onPress={() => setStyle(item.id)} />
        ))}
      </View>
      <View
        ref={stageRef}
        style={styles.stage}
        accessibilityRole="adjustable"
        accessibilityLabel="순위 분배 칸막이"
        accessibilityHint="칸막이를 밀어 등수별 비율을 나눠요"
        accessibilityValue={{ text: value.map((weight, index) => `${index + 1}등 ${weight}%`).join(', ') }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          const divider = activeDivider ?? 0;
          const delta = event.nativeEvent.actionName === 'increment' ? RANK_STEP : -RANK_STEP;
          onChange(moveRankDivider(value, divider, value[divider] + delta));
        }}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          setTrackWidth(nextWidth);
          widthRef.current = nextWidth;
          locate();
        }}
        {...pan.panHandlers}
      >
        <View style={styles.barTrack}>
          {value.map((weight, index) => (
            <View key={`${index}-${weight}`} style={[styles.barSlice, { flex: weight, backgroundColor: RANK_COLORS[index] }]} />
          ))}
        </View>
        {trackWidth > 0 ? stops.map((stop, index) => {
          const focused = activeDivider === index;
          return (
            <View
              key={`handle-${index}`}
              pointerEvents="none"
              style={[styles.handle, focused && styles.handleOn, { left: stop / 100 * trackWidth - HANDLE_WIDTH / 2 }]}
            >
              <View style={styles.handleGrip} />
              <View style={styles.handleGrip} />
            </View>
          );
        }) : null}
      </View>
      <Text style={styles.caption}>미달 1명 · {RANK_EXAMPLE_PENALTY.toLocaleString()}원 중 수수료 1%를 뺀 금액</Text>
      {value.map((weight, index) => (
        <View key={`rank-${index}`} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: RANK_COLORS[index] }]} />
          <Text style={styles.rankLabel}>{index + 1}등</Text>
          <Text style={styles.percent}>{weight}%</Text>
          <Text style={styles.payout}>{examplePayout(weight).toLocaleString()}원</Text>
        </View>
      ))}
    </View>
  );
}

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.x3 },
  title: { color: color.ink, ...typography.label },
  caption: { color: color.inkMuted, ...typography.caption, marginTop: space.x1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  chip: { minHeight: 40, paddingHorizontal: space.x4, borderRadius: radius.input, borderWidth: 1, borderColor: color.borderSubtle, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: color.blue, borderColor: color.blue },
  chipText: { color: color.ink, ...typography.label },
  chipTextOn: { color: color.white, ...typography.button },
  stage: { height: 48, justifyContent: 'center' },
  barTrack: { height: 28, borderRadius: radius.round, overflow: 'hidden', flexDirection: 'row', backgroundColor: color.surfaceMuted },
  barSlice: { minWidth: 2 },
  handle: {
    position: 'absolute',
    top: 4,
    width: HANDLE_WIDTH,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  handleOn: { backgroundColor: color.blueSoft, borderColor: color.blue },
  handleGrip: { width: 10, height: 2, borderRadius: 1, backgroundColor: color.ink },
  row: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: space.x3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rankLabel: { color: color.ink, ...typography.label, width: 28 },
  percent: { color: color.ink, ...typography.label, width: 40 },
  payout: { color: color.inkMuted, ...typography.caption, flex: 1, textAlign: 'right' },
});
