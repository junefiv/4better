import { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { League } from '../types/domain';
import { color, type } from '../design/tokens';
import { withLeagueRounds } from '../data/seed';
import { SessionRound } from './SessionProgress';

export function leagueRounds(league: League) {
  return [...(withLeagueRounds(league).rounds ?? [])].sort((a, b) => a.week - b.week);
}

export function RoundTable({ league, onWeekChange, mineOnly = false }: { league: League; onWeekChange?: (week: number) => void; mineOnly?: boolean }) {
  const rounds = useMemo(() => leagueRounds(league), [league]);
  const startIndex = Math.max(0, rounds.findIndex((round) => round.week === league.week));
  const [page, setPage] = useState(startIndex < 0 ? rounds.length - 1 : startIndex);
  const [width, setWidth] = useState(0);
  const pageRef = useRef(page);
  const widthRef = useRef(0);
  const roundsRef = useRef(rounds);
  const onWeekChangeRef = useRef(onWeekChange);
  const shift = useRef(new Animated.Value(-Math.max(0, startIndex) * 10)).current;
  const sliding = useRef(false);
  pageRef.current = page;
  roundsRef.current = rounds;
  onWeekChangeRef.current = onWeekChange;

  const snapTo = (next: number) => {
    const items = roundsRef.current;
    const size = widthRef.current;
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    sliding.current = true;
    pageRef.current = clamped;
    setPage(clamped);
    onWeekChangeRef.current?.(items[clamped].week);
    Animated.spring(shift, { toValue: -clamped * size, useNativeDriver: true, bounciness: 0, speed: 18 }).start(() => {
      sliding.current = false;
    });
  };

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => !sliding.current && Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onMoveShouldSetPanResponderCapture: (_, gesture) => !sliding.current && Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, gesture) => {
      const size = widthRef.current;
      const last = roundsRef.current.length - 1;
      const origin = -pageRef.current * size;
      let x = origin + gesture.dx;
      const min = -last * size;
      if (x > 0) x = gesture.dx * 0.22;
      if (x < min) x = min + (x - min) * 0.22;
      shift.setValue(x);
    },
    onPanResponderRelease: (_, gesture) => {
      const size = widthRef.current;
      const current = pageRef.current;
      const last = roundsRef.current.length - 1;
      const goPrev = (gesture.dx > size * 0.22 || gesture.vx > 0.45) && current > 0;
      const goNext = (gesture.dx < -size * 0.22 || gesture.vx < -0.45) && current < last;
      snapTo(goPrev ? current - 1 : goNext ? current + 1 : current);
    },
    onPanResponderTerminate: () => snapTo(pageRef.current),
  }), [shift]);

  return (
    <View
      {...pan.panHandlers}
      style={styles.box}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        if (!next || next === widthRef.current) return;
        widthRef.current = next;
        setWidth(next);
        shift.setValue(-pageRef.current * next);
      }}
    >
      {width ? (
        <Animated.View style={[styles.track, { width: width * rounds.length, transform: [{ translateX: shift }] }]}>
          {rounds.map((round) => (
            <View key={round.week} style={{ width }}>
              <SessionRound league={league} round={round} mineOnly={mineOnly} />
            </View>
          ))}
        </Animated.View>
      ) : (
        <SessionRound league={league} round={rounds[page] ?? rounds[0]} mineOnly={mineOnly} />
      )}
    </View>
  );
}

export function RoundMeta({ league, week, compact = false }: { league: League; week: number; compact?: boolean }) {
  const rounds = leagueRounds(league);
  const index = Math.max(0, rounds.findIndex((round) => round.week === week));
  return (
    <View style={styles.meta}>
      <Text style={styles.round}>라운드 {week}/{league.totalWeeks}</Text>
      {rounds.length > 1 && !compact ? (
        <View style={styles.dots}>
          {rounds.map((round, dot) => <View key={round.week} style={[styles.dot, dot === index && styles.dotOn]} />)}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  track: { flexDirection: 'row' },
  meta: { alignItems: 'flex-end', gap: 4 },
  round: { color: color.inkMuted, ...type.caption, fontWeight: '800' },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: color.borderSubtle },
  dotOn: { backgroundColor: color.blue, width: 12 },
});
