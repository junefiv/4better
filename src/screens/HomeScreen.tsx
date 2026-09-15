import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Bell, Camera, ClipboardCheck, Clock3, Play, Plus, RefreshCw, UserCheck } from 'lucide-react-native';
import { AppModel } from '../state/useAppModel';
import { Route } from '../types/domain';
import { color, radius, space, type } from '../design/tokens';
import { AppHeader, EmptyState, InlineNotice, PrimaryAction, ScreenContainer, SectionHeader, Skeleton } from '../components/ui';
import { ConfirmationRow, LeagueSummary, RecapPreview } from '../components/product';

export function HomeScreen({ model, navigate }: { model: AppModel; navigate: (route: Route) => void }) {
  const { width } = useWindowDimensions();
  const { data, hydrated, serverError } = model;
  const desktop = width >= 900;
  const narrow = width < 430;
  const needsReview = data.records.filter((record) => record.ownerId !== 'me' && record.state === 'pending');
  const next = getNextAction(model);

  if (!hydrated) return <ScreenContainer><AppHeader /><Skeleton height={120} /><View style={{ height: space.x4 }} /><Skeleton height={390} /></ScreenContainer>;
  return (
    <ScreenContainer>
      <AppHeader subtitle={`안녕하세요, ${data.nickname}님`} onNotifications={() => navigate('profile')} onNew={() => navigate('create')} />
      {data.offline ? <InlineNotice title="오프라인 상태예요" body="새 기록은 기기에 저장되고 연결되면 동기화됩니다." tone="warning" action="연결 확인" onAction={() => model.setOffline(false)} /> : null}
      {serverError ? <InlineNotice title="동기화하지 못했어요" body={serverError} tone="danger" action="닫기" onAction={model.clearError} /> : null}

      <View style={[styles.priority, narrow && styles.priorityNarrow]}>
        <View style={styles.priorityMain}><View style={styles.priorityIcon}>{next.icon}</View><View style={styles.flex}><Text style={styles.priorityHint}>지금 할 일</Text><Text style={styles.priorityTitle}>{next.title}</Text><Text style={styles.priorityBody}>{next.body}</Text></View></View>
        <PrimaryAction compact={!narrow} label={next.label} onPress={() => navigate(next.route)} />
      </View>

      {!data.league ? <EmptyState title="아직 참여 중인 리그가 없어요" body="친구 2~4명과 같은 목표를 정하고 첫 주를 시작해 보세요." action="새 리그 시작" onAction={() => navigate('create')} /> : (
        <View style={[styles.columns, desktop && styles.columnsDesktop]}>
          <View style={[styles.mainColumn, desktop && styles.desktopMain]}>
            <SectionHeader title="이번 주 리그" detail="방 전체 기간이 아닌 현재 라운드의 기록입니다" />
            <LeagueSummary league={data.league} onOpen={() => navigate('league')} onPrimary={() => navigate(data.timerRunning ? 'timer' : 'timer')} />
          </View>
          <View style={[styles.sideColumn, desktop && styles.desktopSide]}>
            <View>
              <SectionHeader title="내 확인이 필요해요" detail={needsReview.length ? `확인 마감까지 18시간 · ${needsReview.length}건` : '밀린 확인이 없습니다'} action={needsReview.length ? '전체 보기' : undefined} onAction={() => navigate('reviews')} />
              <View style={styles.listSurface}>{needsReview.length ? needsReview.slice(0, 2).map((record) => <ConfirmationRow key={record.id} record={record} onOpen={() => navigate('reviews')} />) : <EmptyState title="모두 확인했어요" body="다음 기록이 도착하면 알려드릴게요." />}</View>
            </View>
            <View style={styles.recapSection}><SectionHeader title="주간 리캡" detail="친구들과 함께 만든 과정" /><RecapPreview hasMedia={data.records.some((record) => record.state === 'confirmed')} onPress={() => navigate('recap')} /></View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

function getNextAction(model: AppModel): { title: string; body: string; label: string; route: Route; icon: React.ReactNode } {
  const { data, timerSeconds } = model;
  if (!data.league) return { title: '첫 리그를 만들어 보세요', body: '목표와 규칙을 정하면 친구를 초대할 수 있어요.', label: '새 리그', route: 'create', icon: <Plus size={22} color={color.leagueDark} /> };
  if (data.league.state === 'agreement') return { title: '초대받은 규칙을 확인해 주세요', body: '전원이 동의하면 같은 시각에 리그가 시작됩니다.', label: '규칙 보기', route: 'agreement', icon: <UserCheck size={22} color={color.leagueDark} /> };
  if (data.league.state === 'waiting') return { title: '한 명만 더 오면 시작할 수 있어요', body: '초대 코드를 공유하고 참가를 기다려 주세요.', label: '초대하기', route: 'league', icon: <RefreshCw size={22} color={color.leagueDark} /> };
  if (data.timerRunning) return { title: `${formatClock(timerSeconds)}째 집중 중이에요`, body: '앱을 닫아도 시작 시각을 기준으로 이어집니다.', label: '이어서 하기', route: 'timer', icon: <Clock3 size={22} color={color.leagueDark} /> };
  const review = data.records.find((record) => record.ownerId !== 'me' && record.state === 'pending');
  if (review) return { title: `${review.ownerName}님의 기록을 확인해 주세요`, body: `${review.value}${review.unit} · ${review.note}`, label: '기록 확인', route: 'reviews', icon: <ClipboardCheck size={22} color={color.leagueDark} /> };
  if (data.league.state === 'last_week') return { title: '마지막 주예요', body: '친구들의 연장 제안을 확인해 주세요.', label: '연장 동의', route: 'extension', icon: <Bell size={22} color={color.leagueDark} /> };
  if (data.records.some((record) => record.state === 'confirmed')) return { title: '오늘의 과정을 남겨보세요', body: '사진 1장과 2초 영상이 이번 주 리캡이 됩니다.', label: '리캡 촬영', route: 'capture', icon: <Camera size={22} color={color.leagueDark} /> };
  return { title: '오늘 3시간 20분 남았어요', body: '짧게라도 시작하면 친구들의 트랙에 내 위치가 표시돼요.', label: '집중 시작', route: 'timer', icon: <Play size={22} color={color.leagueDark} /> };
}

export function formatClock(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const secs = seconds % 60; return [hours, minutes, secs].map((value) => String(value).padStart(2, '0')).join(':'); }

const styles = StyleSheet.create({
  flex: { flex: 1 }, priority: { marginTop: space.x3, marginBottom: space.x8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.borderSubtle, paddingVertical: space.x4, flexDirection: 'row', alignItems: 'center', gap: space.x3 }, priorityNarrow: { flexDirection: 'column', alignItems: 'stretch' }, priorityMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.x3 }, priorityIcon: { width: 44, height: 44, borderRadius: radius.input, backgroundColor: color.secondary, alignItems: 'center', justifyContent: 'center' }, priorityHint: { color: color.primaryPressed, ...type.caption, fontWeight: '700' }, priorityTitle: { color: color.ink, ...type.heading }, priorityBody: { color: color.inkMuted, ...type.caption, marginTop: 2 },
  columns: { gap: space.x8 }, columnsDesktop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.x6 }, mainColumn: { width: '100%' }, desktopMain: { width: '63%' }, sideColumn: { gap: space.x8, width: '100%' }, desktopSide: { width: '35%' },
  listSurface: { backgroundColor: color.surface, borderRadius: radius.card, borderWidth: 1, borderColor: color.borderSubtle, paddingHorizontal: space.x4 }, recapSection: {},
});
