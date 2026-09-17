import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { AppModel } from '../state/useAppModel';
import { League, Route } from '../types/domain';
import { color, radius, space, typography } from '../design/tokens';
import { AppHeader, EmptyState, InlineNotice, ScreenContainer, Skeleton } from '../components/ui';
import { LeagueCard } from '../components/product';
import { sessionQuickStart } from '../data/goals';
import { isLeagueActive } from '../data/seed';
import { remoteErrorMessage } from '../lib/remoteLeague';

export function HomeScreen({ model, navigate }: { model: AppModel; navigate: (route: Route) => void }) {
  const { data, hydrated, serverError } = model;
  const [tab, setTab] = useState<'active' | 'ended'>('active');
  const visibleLeagues = useMemo(
    () => data.leagues.filter((league) => tab === 'active' ? isLeagueActive(league) : !isLeagueActive(league)),
    [data.leagues, tab],
  );

  const openLeague = (league: League) => {
    model.selectLeague(league);
    navigate('league');
  };

  const startCheck = async (league: League) => {
    const start = sessionQuickStart(league.kind);
    model.selectLeague(league);
    try {
      if (start.startsSession) await model.startTimer();
      navigate(start.route);
    } catch (error) {
      Alert.alert('체크를 시작하지 못했어요', remoteErrorMessage(error));
    }
  };

  if (!hydrated) return <ScreenContainer><AppHeader /><Skeleton height={120} /><View style={{ height: space.x4 }} /><Skeleton height={390} /></ScreenContainer>;
  return (
    <ScreenContainer>
      <AppHeader onNotifications={() => navigate('profile')} />
      <Text style={styles.greeting}>안녕하세요, {data.nickname}님</Text>
      {data.offline ? <InlineNotice title="오프라인 상태예요" body="새 기록은 기기에 저장되고 연결되면 동기화됩니다." tone="warning" action="연결 확인" onAction={() => model.setOffline(false)} /> : null}
      {serverError ? <InlineNotice title="동기화하지 못했어요" body={serverError} tone="danger" action="닫기" onAction={model.clearError} /> : null}

      <View style={styles.toggle}>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'active' }} onPress={() => setTab('active')} style={[styles.toggleItem, tab === 'active' && styles.toggleItemOn]}>
          <Text style={[styles.toggleText, tab === 'active' && styles.toggleTextOn]}>진행중</Text>
          <View style={[styles.toggleMark, tab === 'active' ? styles.toggleMarkOrange : styles.toggleMarkOff]} />
        </Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'ended' }} onPress={() => setTab('ended')} style={[styles.toggleItem, tab === 'ended' && styles.toggleItemOn]}>
          <Text style={[styles.toggleText, tab === 'ended' && styles.toggleTextOn]}>종료된</Text>
          <View style={[styles.toggleMark, tab === 'ended' ? styles.toggleMarkBlue : styles.toggleMarkOff]} />
        </Pressable>
      </View>

      {visibleLeagues.length ? (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="새 리그 만들기" onPress={() => navigate('create')} style={({ pressed }) => [styles.add, pressed && styles.addPressed]}>
            <Plus size={22} color={color.blue} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.list}>
            {visibleLeagues.map((league) => <LeagueCard key={league.id} league={league} onPress={() => openLeague(league)} onStart={() => startCheck(league)} />)}
          </View>
        </>
      ) : (
        <EmptyState
          title={tab === 'active' ? '진행 중인 리그가 없어요' : '종료된 리그가 없어요'}
          body={tab === 'active' ? (model.authUserId ? '리그를 만들면 이번 주 체크가 바로 시작돼요. 초대는 나중에 붙일게요.' : 'Google로 로그인하면 만든 리그가 저장됩니다.') : '끝난 리그는 여기에 모아 둘게요.'}
          icon={
            <Pressable accessibilityRole="button" accessibilityLabel="새 리그 만들기" onPress={() => navigate('create')} style={({ pressed }) => [styles.add, styles.emptyAdd, pressed && styles.addPressed]}>
              <Plus size={22} color={color.blue} strokeWidth={2.4} />
            </Pressable>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: { color: color.ink, ...typography.screenTitle, marginBottom: space.x4 },
  toggle: { flexDirection: 'row', backgroundColor: color.surfaceMuted, borderRadius: radius.input, padding: 4, marginBottom: space.x4 },
  add: { width: 44, height: 44, borderRadius: 22, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface, borderWidth: 1, borderColor: color.borderSubtle, marginBottom: space.x5 },
  emptyAdd: { marginBottom: 0 },
  addPressed: { transform: [{ scale: 0.96 }], opacity: 0.88 },
  toggleItem: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleItemOn: { backgroundColor: color.surface },
  toggleText: { color: color.inkMuted, ...typography.tab },
  toggleTextOn: { color: color.ink, ...typography.tab },
  toggleMark: { width: 22, height: 3, borderRadius: 2, marginTop: 4 },
  toggleMarkOrange: { backgroundColor: color.orange },
  toggleMarkBlue: { backgroundColor: color.blue },
  toggleMarkOff: { backgroundColor: 'transparent' },
  list: { gap: space.x4 },
});

export function formatClock(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, '0')).join(':');
}
