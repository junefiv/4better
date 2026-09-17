import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Bell, Check } from 'lucide-react-native';
import { AppModel } from '../state/useAppModel';
import { Route } from '../types/domain';
import { color, radius, space, typography } from '../design/tokens';
import { AppHeader, InlineNotice, PrimaryAction, ScreenContainer } from '../components/ui';
import { isRemoteLeague, remoteErrorMessage } from '../lib/remoteLeague';

export function MorningScreen({ model, back, navigate }: { model: AppModel; back: () => void; navigate: (route: Route) => void }) {
  const [phase, setPhase] = useState<'alarm' | 'steps' | 'awake' | 'asleep'>('alarm');
  const [busy, setBusy] = useState(false);
  const league = model.data.league;
  const completeWake = async () => {
    setBusy(true);
    try {
      if (isRemoteLeague(league)) await model.submitCheck(1, '기상');
      setPhase('awake');
    } catch (error) {
      Alert.alert('기상을 저장하지 못했어요', remoteErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader title="기상 체크" subtitle={league?.name ?? '아침형 인간'} onBack={back} />
      <View style={styles.panel}>
        {phase === 'alarm' ? <Bell size={28} color={color.aqua} /> : <Check size={28} color={color.lime} />}
        <Text style={styles.panelTitle}>
          {phase === 'alarm' ? '알람을 끄면 체크가 시작돼요' : phase === 'steps' ? '이제 몇 걸음 걸어 주세요' : phase === 'awake' ? '완전히 일어났어요' : '다시 잠든 것으로 봐요'}
        </Text>
        <Text style={styles.panelBody}>
          {phase === 'alarm'
            ? '알람만 끄면 아직 일어난 것이 아닙니다. 끈 뒤에 걸어야 완료됩니다.'
            : phase === 'steps'
              ? '알람을 끈 뒤 정해진 시간 안에 핸드폰을 들고 걸으면 일어난 것으로 집계합니다.'
              : phase === 'awake'
                ? '이번 주기 성공에 들어갑니다.'
                : '걸음이 없어서 다시 잠듦으로 기록합니다.'}
        </Text>
      </View>
      {phase === 'alarm' ? <PrimaryAction label="알람 끄기" icon={Bell} onPress={() => setPhase('steps')} /> : null}
      {phase === 'steps' ? (
        <View style={styles.actions}>
          <PrimaryAction label="걸어서 기상 완료" icon={Check} loading={busy} onPress={() => void completeWake()} />
          <PrimaryAction label="다시 잠듦" tone="quiet" onPress={() => setPhase('asleep')} />
        </View>
      ) : null}
      {phase === 'awake' || phase === 'asleep' ? <PrimaryAction label="홈으로" onPress={() => navigate('home')} /> : null}
      <InlineNotice title={isRemoteLeague(league) ? '이번 기상은 기록으로 저장돼요' : '미리보기'} body={isRemoteLeague(league) ? '알람·만보기 연동 전이라 버튼으로 체크합니다. 초대 전에는 바로 확정됩니다.' : '실제 알람과 만보기는 아직 기기에 연결하지 않았습니다.'} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: color.ink, borderRadius: radius.league, padding: space.x6, gap: space.x3, marginBottom: space.x5 },
  panelTitle: { color: color.white, ...typography.sectionTitle },
  panelBody: { color: '#CBD5E1', ...typography.bodyMedium },
  actions: { gap: space.x3 },
});
