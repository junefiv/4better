import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, typography } from '../design/tokens';
import { GOAL_DEFAULTS, goalMeasures } from '../data/goals';
import { GoalKind } from '../types/domain';
import {
  CHECK_PERIODS,
  CheckPeriod,
  WAKE_HOURS,
  WAKE_MINUTES,
  WRITING_TYPES,
  formatWakeTime,
  hidesTargetStepper,
  setupHint,
  setupMeasure,
  targetLabel,
  targetPresets,
  targetRange,
} from '../lib/sessionSetup';

export function SessionSetup({
  kind,
  period,
  measureId,
  target,
  writingType,
  wakeHour,
  wakeMinute,
  onPeriod,
  onMeasure,
  onTarget,
  onWritingType,
  onWake,
}: {
  kind: GoalKind;
  period: CheckPeriod;
  measureId: string;
  target: number;
  writingType: string;
  wakeHour: number;
  wakeMinute: number;
  onPeriod: (period: CheckPeriod) => void;
  onMeasure: (id: string) => void;
  onTarget: (value: number) => void;
  onWritingType: (id: string) => void;
  onWake: (hour: number, minute: number) => void;
}) {
  const measures = goalMeasures(kind);
  const measure = setupMeasure(kind, period, measureId);
  const range = targetRange(kind, period, measureId);
  const presets = targetPresets(kind, period, measureId);
  const hideTarget = hidesTargetStepper(kind, period);

  return (
    <View style={styles.stack}>
      <View style={styles.field}>
        <Text style={styles.title}>체크 주기</Text>
        <Text style={styles.caption}>이 주기마다 목표량을 처음부터 다시 세요.</Text>
        <View style={styles.chips}>
          {CHECK_PERIODS.map((item) => (
            <Chip key={item.id} active={period === item.id} label={item.label} onPress={() => onPeriod(item.id)} />
          ))}
        </View>
      </View>

      {kind === 'writing' ? (
        <View style={styles.field}>
          <Text style={styles.title}>글 종류</Text>
          <Text style={styles.caption}>카드에서 하나를 고르면 멤버 모두 같은 방식으로 올려요.</Text>
          <View style={styles.chips}>
            {WRITING_TYPES.map((item) => (
              <Chip key={item.id} active={writingType === item.id} label={item.label} onPress={() => onWritingType(item.id)} />
            ))}
          </View>
        </View>
      ) : null}

      {kind === 'morning' ? (
        <View style={styles.field}>
          <Text style={styles.title}>공통 기상 알람</Text>
          <Text style={styles.caption}>지금은 방 전원에게 같은 시각을 써요. 끈 뒤 {GOAL_DEFAULTS.wakeWindow}분 안에 {GOAL_DEFAULTS.wakeSteps}걸음이면 일어난 거예요.</Text>
          <View style={styles.chips}>
            {WAKE_HOURS.map((hour) => (
              <Chip key={hour} active={wakeHour === hour} label={`${hour}시`} onPress={() => onWake(hour, wakeMinute)} />
            ))}
          </View>
          <View style={styles.chips}>
            {WAKE_MINUTES.map((minute) => (
              <Chip key={minute} active={wakeMinute === minute} label={`${String(minute).padStart(2, '0')}분`} onPress={() => onWake(wakeHour, minute)} />
            ))}
          </View>
          <Text style={styles.summary}>{formatWakeTime(wakeHour, wakeMinute)} 알람</Text>
        </View>
      ) : null}

      {measures.length > 1 ? (
        <View style={styles.field}>
          <Text style={styles.title}>무엇으로 셀까요</Text>
          <View style={styles.chips}>
            {measures.map((item) => (
              <Chip key={item.id} active={measureId === item.id} label={item.label} onPress={() => onMeasure(item.id)} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.title}>{targetLabel(kind, period, measureId)}</Text>
        <Text style={styles.caption}>{setupHint(kind, period, measureId)}</Text>
        {hideTarget ? (
          <Text style={styles.summary}>하루 1번 · 성공 또는 다시 잠듦</Text>
        ) : (
          <>
            {presets.length ? (
              <View style={styles.chips}>
                {presets.map((item) => (
                  <Chip key={item.value} active={target === item.value} label={item.label} onPress={() => onTarget(item.value)} />
                ))}
              </View>
            ) : null}
            <View style={styles.stepper}>
              <Pressable accessibilityLabel="목표 줄이기" onPress={() => onTarget(Math.max(range.min, target - range.step))} style={styles.step}>
                <Text style={styles.stepText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{measure.unit === '걸음' ? target.toLocaleString() : target}{measure.unit}</Text>
              <Pressable accessibilityLabel="목표 늘리기" onPress={() => onTarget(Math.min(range.max, target + range.step))} style={styles.step}>
                <Text style={styles.stepText}>+</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
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
  stack: { gap: space.x5 },
  field: { gap: space.x2 },
  title: { color: color.ink, ...typography.label },
  caption: { color: color.inkMuted, ...typography.caption },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  chip: { minHeight: 40, paddingHorizontal: space.x4, borderRadius: radius.input, borderWidth: 1, borderColor: color.borderSubtle, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: color.blue, borderColor: color.blue },
  chipText: { color: color.ink, ...typography.label },
  chipTextOn: { color: color.white, ...typography.button },
  summary: { color: color.blue, ...typography.label },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.x3, minHeight: 48 },
  step: { width: 40, height: 40, borderRadius: radius.control, borderWidth: 1, borderColor: color.borderSubtle, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: color.ink, ...typography.statMD },
  stepValue: { minWidth: 88, color: color.ink, ...typography.cardTitle, textAlign: 'center' },
});
