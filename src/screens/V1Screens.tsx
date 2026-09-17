import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AlertTriangle, Bell, BookOpen, Camera, Check, CheckCircle2, Clock3, Copy, FileText, Flag, HelpCircle, Image as ImageIcon, Link2, LogOut, MessageSquareWarning, Pause, PenLine, Play, Plus, RotateCcw, ShieldCheck, Trash2, UserMinus, Users, X } from 'lucide-react-native';
import { AppModel } from '../state/useAppModel';
import { GoalKind, GoalRecord, LeagueState, Route } from '../types/domain';
import { color, onChip, radius, space, typography } from '../design/tokens';
import { GOAL_PRESETS, GoalGuide, goalLabel, goalMeasures, goalPreset, isTimeGoal, persistUnit, sessionProgressTitle, sessionQuickStart } from '../data/goals';
import { AppHeader, Brand, EmptyState, InlineNotice, PrimaryAction, ScreenContainer, SectionHeader, StatusBadge } from '../components/ui';
import { RankSplitEditor } from '../components/RankSplit';
import { SessionSetup } from '../components/SessionSetup';
import { ConfirmationRow, RecapPreview, ReviewActions } from '../components/product';
import { formatValue } from '../lib/format';
import { DEFAULT_RANK_WEIGHTS, isValidRankSplit } from '../lib/rankSplit';
import { createTargetValue, isRemoteLeague, remoteErrorMessage } from '../lib/remoteLeague';
import { CheckPeriod, defaultTarget, setupMeasure } from '../lib/sessionSetup';
import { RoundTable } from '../components/RoundTable';
import { formatClock } from './HomeScreen';

type NavProps = { model: AppModel; back: () => void; navigate: (route: Route) => void };

export function AuthScreen({ model, navigate }: Omit<NavProps, 'back'>) {
  const [nickname, setNickname] = useState(model.pendingNickname ?? '');
  const [previewId, setPreviewId] = useState('git_in');
  const [previewPassword, setPreviewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (model.pendingNickname != null) setNickname(model.pendingNickname); }, [model.pendingNickname]);
  const social = async () => { setBusy(true); try { await model.signInSocial(); } catch (error) { Alert.alert('로그인하지 못했어요', error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.'); } finally { setBusy(false); } };
  const preview = async () => {
    setBusy(true);
    try {
      await model.signInPreview(previewId, previewPassword);
      navigate('home');
    } catch (error) {
      Alert.alert('미리보기 로그인에 실패했어요', error instanceof Error ? error.message : '아이디와 비밀번호를 확인해 주세요.');
    } finally {
      setBusy(false);
    }
  };
  const finishProfile = async () => { setBusy(true); try { await model.completeSocialProfile(nickname); navigate('home'); } catch (error) { Alert.alert('닉네임을 저장하지 못했어요', error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.'); } finally { setBusy(false); } };
  if (model.needsNicknameSetup) return <ScreenContainer bottomInset={32}><View style={styles.auth}><Brand /><View style={styles.authCopy}><StatusBadge label="Google 가입 완료" tone="success" /><Text style={styles.authDisplay}>앱에서 사용할{`\n`}닉네임을 정해 주세요.</Text><Text style={styles.textBody}>Google 계정의 표시 이름을 기본값으로 가져왔어요. 원하면 지금 바꿀 수 있습니다.</Text></View><Field label="닉네임" value={nickname} onChangeText={setNickname} placeholder="2~20자" /><PrimaryAction label="닉네임 저장하고 시작" icon={Check} loading={busy} disabled={nickname.trim().length < 2 || nickname.trim().length > 20} onPress={finishProfile} /></View></ScreenContainer>;
  return (
    <ScreenContainer bottomInset={32}>
      <View style={styles.auth}>
        <View style={styles.authCopy}>
          <Image source={require('../../assets/logo_4better.png')} accessibilityLabel="4better" resizeMode="contain" style={styles.authLogo} />
          <Text style={styles.authTagline}>친구 2~4명의 비공개 목표 리그</Text>
        </View>
        <View style={styles.stack}>
          <PrimaryAction label="Google로 계속" icon={ShieldCheck} loading={busy} onPress={social} />
          <Field label="미리보기 아이디" value={previewId} onChangeText={setPreviewId} autoCapitalize="none" autoCorrect={false} placeholder="git_in" />
          <Field label="비밀번호" value={previewPassword} onChangeText={setPreviewPassword} autoCapitalize="none" secureTextEntry placeholder="테스트 비밀번호" />
          <PrimaryAction label="미리보기 계정으로 시작" icon={Play} tone="quiet" loading={busy} onPress={preview} />
        </View>
        <Text style={styles.legal}>테스트 기간용 미리보기 로그인은 Supabase에 저장됩니다. 계속하면 이용약관과 개인정보 처리방침에 동의하게 됩니다.</Text>
      </View>
    </ScreenContainer>
  );
}

export function CreateLeagueScreen({ model, back, navigate }: NavProps) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<GoalKind>('study');
  const [period, setPeriod] = useState<CheckPeriod>('week');
  const [measureId, setMeasureId] = useState(goalMeasures('study')[0].id);
  const [target, setTarget] = useState(defaultTarget('study', 'week', 'minutes'));
  const [writingType, setWritingType] = useState('free');
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMinute, setWakeMinute] = useState(0);
  const [weeks, setWeeks] = useState(4);
  const [rankWeights, setRankWeights] = useState(DEFAULT_RANK_WEIGHTS);
  const [busy, setBusy] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const preset = goalPreset(kind);
  const measure = setupMeasure(kind, period, measureId);
  const applyKind = (next: GoalKind) => {
    const nextMeasure = goalMeasures(next)[0].id;
    setKind(next);
    setMeasureId(nextMeasure);
    setTarget(defaultTarget(next, period, nextMeasure));
  };
  const applyPeriod = (next: CheckPeriod) => {
    setPeriod(next);
    setTarget(defaultTarget(kind, next, measureId));
  };
  const applyMeasure = (next: string) => {
    setMeasureId(next);
    setTarget(defaultTarget(kind, period, next));
  };
  const create = async () => {
    if (!model.authUserId) {
      Alert.alert('로그인해 주세요', 'Google 또는 미리보기 계정으로 로그인하면 리그와 체크가 Supabase에 남습니다.');
      return;
    }
    setBusy(true);
    try {
      const league = await model.createLeague({
        name: name.trim(),
        kind,
        weeklyTarget: createTargetValue(kind, target, measure.unit),
        unit: persistUnit(measure.unit),
        plannedWeeks: weeks,
        rankWeights,
      });
      if (league) model.selectLeague(league);
      navigate('league');
    } catch (error) {
      Alert.alert('리그를 만들지 못했어요', remoteErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScreenContainer>
      <AppHeader title="새 리그" subtitle="방장이 규칙을 먼저 제안합니다" onBack={back} />
      <SectionHeader title="무엇을 함께할까요?" />
      <View style={styles.segment}>
        {GOAL_PRESETS.map((item) => (
          <Choice key={item.id} active={kind === item.id} label={item.label} onPress={() => applyKind(item.id)} />
        ))}
      </View>
      <View style={styles.sessionCard}>
        <View style={styles.sessionHead}>
          <Text style={styles.textLabel}>{preset.label}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`${preset.label} 인정 기준`} onPress={() => setGuideOpen(true)} style={styles.helpButton}>
            <HelpCircle size={18} color={color.blue} strokeWidth={2.2} />
          </Pressable>
        </View>
        <Text style={styles.textCaption}>{preset.about}</Text>
      </View>
      <RecognitionGuide visible={guideOpen} guide={preset.guide} onClose={() => setGuideOpen(false)} />
      <View style={styles.form}>
        <Field label="리그 이름" value={name} onChangeText={setName} placeholder={`${preset.label} 목표 달성하기`} />
        <SessionSetup
          kind={kind}
          period={period}
          measureId={measureId}
          target={target}
          writingType={writingType}
          wakeHour={wakeHour}
          wakeMinute={wakeMinute}
          onPeriod={applyPeriod}
          onMeasure={applyMeasure}
          onTarget={setTarget}
          onWritingType={setWritingType}
          onWake={(hour, minute) => { setWakeHour(hour); setWakeMinute(minute); }}
        />
        <Stepper label="리그 기간" value={weeks} unit="주" min={1} max={12} onChange={setWeeks} />
        <ReadOnlyRow label="주간 페널티" value="10,000원" />
        <ReadOnlyRow label="플랫폼 계산 수수료" value="총 페널티의 1%" />
        <RankSplitEditor value={rankWeights} onChange={setRankWeights} />
      </View>
      <InlineNotice title={model.authUserId ? '초대는 나중에 붙일게요' : '지금은 Google 로그인 계정만 저장돼요'} body={model.authUserId ? '방을 만들면 바로 이번 주 체크를 시작할 수 있어요. 친구 초대와 전원 확인은 다음 단계입니다.' : '미리보기 계정으로는 더미 화면만 볼 수 있어요.'} />
      <View style={styles.bottomAction}><PrimaryAction label="리그 만들고 체크 시작" loading={busy} onPress={create} disabled={!name.trim() || target <= 0 || !isValidRankSplit(rankWeights) || busy} /></View>
    </ScreenContainer>
  );
}

export function JoinScreen({ back, navigate }: NavProps) {
  const [code, setCode] = useState('BETTER24');
  return <ScreenContainer><AppHeader title="초대받은 리그" subtitle="코드 또는 초대 링크로 참가합니다" onBack={back} /><View style={styles.form}><Field label="초대 코드" value={code} onChangeText={(value) => setCode(value.toUpperCase())} autoCapitalize="characters" /><PrimaryAction label="리그 찾기" icon={Link2} onPress={() => navigate('agreement')} disabled={code.length < 6} /></View><InlineNotice title="초대 링크도 지원해요" body="fourbetter://invite/BETTER24 형식의 딥링크를 앱이 열 수 있습니다." /></ScreenContainer>;
}

export function AgreementScreen({ model, back, navigate }: NavProps) {
  const league = model.data.league; const [agreed, setAgreed] = useState(false);
  if (!league) return <ScreenContainer><EmptyState title="확인할 규칙이 없어요" body="초대 코드를 다시 확인해 주세요." action="홈으로" onAction={() => navigate('home')} /></ScreenContainer>;
  return <ScreenContainer><AppHeader title="리그 규칙 확인" subtitle="규칙 버전 1 · 전원 동의 후 시작" onBack={back} /><View style={styles.ruleHeader}><Flag size={24} color={color.lime} /><View style={styles.flex}><Text style={styles.ruleHeading}>{league.name}</Text><Text style={styles.ruleCaption}>{league.members.length}명 · {league.totalWeeks}주 · 매주 월요일 새 라운드</Text></View></View><View style={styles.form}><ReadOnlyRow label="공통 목표" value={`주 ${formatValue(league.target, league.unit)}`} /><ReadOnlyRow label="페널티" value={`${league.penaltyWon.toLocaleString()}원`} /><ReadOnlyRow label="순위별 분배율" value={league.rankWeights.join(' · ') + '%'} /><ReadOnlyRow label="기록 인정" value="본인 제외 전원 확인" /><ReadOnlyRow label="동점 처리" value="공동 순위 비율 합산 후 균등 분배" /></View><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agreed }} onPress={() => setAgreed((value) => !value)} style={styles.checkRow}><View style={[styles.checkbox, agreed && styles.checkboxOn]}>{agreed ? <Check size={15} color={color.ink} strokeWidth={3} /> : null}</View><Text style={styles.textBody}>위 규칙과 예상 정산 방식을 확인했습니다.</Text></Pressable><PrimaryAction label="동의하고 대기실로" onPress={() => { model.setLeagueState('waiting'); navigate('league'); }} disabled={!agreed} /></ScreenContainer>;
}

export function LeagueScreen({ model, back, navigate }: NavProps) {
  const league = model.data.league;
  if (!league) return <ScreenContainer><AppHeader title="리그" onBack={back} /><EmptyState title="리그가 없어요" body="새 리그를 만들거나 초대 코드로 참여하세요." action="새 리그" onAction={() => navigate('create')} /></ScreenContainer>;
  const waiting = league.state === 'waiting';
  const start = sessionQuickStart(league.kind);
  const invite = async () => { const url = `fourbetter://invite/BETTER24`; if (Platform.OS === 'web') await navigator.clipboard?.writeText(url); else await Share.share({ message: `${league.name}에 초대합니다: ${url}` }); };
  const beginCheck = async () => {
    try {
      if (start.startsSession) await model.startTimer();
      navigate(start.route);
    } catch (error) {
      Alert.alert('체크를 시작하지 못했어요', remoteErrorMessage(error));
    }
  };
  return <ScreenContainer><AppHeader title={league.name} subtitle={`${league.week}주차 / 전체 ${league.totalWeeks}주`} onBack={back} /><View style={styles.ruleHeader}><View style={styles.flex}><StatusBadge label={waiting ? '시작 대기' : '진행 중'} tone={waiting ? 'warning' : 'success'} /><Text style={[styles.ruleHeading, { marginTop: space.x2 }]}>{waiting ? '친구가 모두 모이면 시작해요' : `${league.deadlineLabel}`}</Text></View>{isRemoteLeague(league) ? null : <PrimaryAction compact label="초대" icon={Copy} tone="quiet" onPress={invite} />}</View>{waiting ? <InlineNotice title="현재 2명 · 최소 인원 충족" body="모든 멤버가 규칙에 동의하면 방장이 리그를 시작할 수 있습니다." /> : <View style={styles.section}><SectionHeader title={sessionProgressTitle(league.kind)} detail="확정된 기록 · 좌우로 이전 라운드" /><RoundTable league={league} /></View>}{waiting ? <PrimaryAction label="전원 동의 완료 · 리그 시작" onPress={() => { model.setLeagueState('active'); navigate('home'); }} /> : <PrimaryAction label={start.actionLabel} icon={Play} onPress={beginCheck} />}<Pressable onPress={() => navigate('results')} style={styles.textAction}><Text style={styles.link}>주간 결과와 예상 정산 보기</Text></Pressable></ScreenContainer>;
}

export function TimerScreen({ model, back, navigate }: NavProps) {
  const [, tick] = useState(0);
  useEffect(() => { if (!model.data.timerRunning) return; const id = setInterval(() => tick((value) => value + 1), 1000); return () => clearInterval(id); }, [model.data.timerRunning]);
  const finish = () => { navigate('submit'); };
  const toggle = async () => {
    try {
      if (model.data.timerRunning) await model.pauseTimer();
      else await model.startTimer();
    } catch (error) {
      Alert.alert('타이머를 바꾸지 못했어요', remoteErrorMessage(error));
    }
  };
  return <ScreenContainer><AppHeader title="집중 세션" subtitle={isRemoteLeague(model.data.league) ? '서버에 시작 시각이 저장됩니다' : '미리보기 타이머'} onBack={back} /><View style={styles.timerPanel}><Text style={styles.timerRound}>{model.data.league?.name ?? '이번 주'}</Text><Text accessibilityLabel={`${Math.floor(model.timerSeconds / 60)}분 경과`} style={styles.timer}>{formatClock(model.timerSeconds)}</Text><Text style={styles.timerState}>{model.data.timerRunning ? '집중 중 · 앱을 닫아도 계속 기록돼요' : '잠시 멈춤'}</Text><View style={styles.timerControls}><Pressable accessibilityRole="button" accessibilityLabel={model.data.timerRunning ? '일시정지' : '계속'} onPress={toggle} style={styles.timerMain}>{model.data.timerRunning ? <Pause size={27} color={color.ink} /> : <Play size={27} color={color.ink} />}</Pressable><Pressable accessibilityRole="button" onPress={finish} style={styles.timerFinish}><Check size={21} color={color.white} /><Text style={styles.timerFinishText}>종료</Text></Pressable></View></View><InlineNotice title="종료하면 설명과 함께 이번 주 기록으로 저장돼요" body="초대 전이라 지금은 본인 체크가 바로 확정됩니다." /></ScreenContainer>;
}

export function SubmitScreen({ model, back, navigate }: NavProps) {
  const league = model.data.league;
  const remote = isRemoteLeague(league);
  const draft = model.data.records.find((record) => record.ownerId === 'me' && (record.state === 'draft' || record.state === 'changes_requested'));
  const [kind, setKind] = useState<'writing' | 'drawing'>('writing');
  const [note, setNote] = useState(draft?.note ?? '');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      if (remote && league) {
        if (isTimeGoal(league.kind, league.unit) && (model.data.timerRunning || model.data.timerStartedAt || model.data.timerAccumulatedSeconds > 0)) {
          await model.finishTimer(note);
        } else {
          await model.submitCheck(isTimeGoal(league.kind, league.unit) ? Math.max(1, Math.floor(model.timerSeconds / 60)) : 1, note);
        }
        navigate('home');
        return;
      }
      if (draft) model.submitRecord(draft.id, note);
      else model.createCreativeRecord(kind, note);
      navigate('reviews');
    } catch (error) {
      Alert.alert('기록을 저장하지 못했어요', remoteErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return <ScreenContainer><AppHeader title={remote ? '이번 체크 저장' : draft ? '기록 제출' : '창작물 제출'} subtitle={remote ? '초대 전에는 내 기록이 바로 확정돼요' : draft?.state === 'changes_requested' ? `설명 요청 반영 · 버전 ${draft.version + 1}` : '제출 후 수정하면 새 버전이 생성됩니다'} onBack={back} />{!remote && !draft ? <View style={styles.segment}><Choice active={kind === 'writing'} label="글쓰기" icon={PenLine} onPress={() => setKind('writing')} /><Choice active={kind === 'drawing'} label="그림" icon={ImageIcon} onPress={() => setKind('drawing')} /></View> : <View style={styles.metric}><Text style={styles.metricLabel}>이번 기록</Text><Text style={styles.metricValue}>{remote && league ? (isTimeGoal(league.kind, league.unit) ? `${Math.max(1, Math.floor(model.timerSeconds / 60))}분` : `1${league.unit}`) : `${draft?.value ?? 1}${draft?.unit ?? '회'}`}</Text></View>}<Field multiline label="메모" value={note} onChangeText={setNote} placeholder="무엇을 했는지 적어주세요" /><Pressable onPress={() => navigate('capture')} style={styles.mediaRow}><Camera size={20} color={color.blue} /><View style={styles.flex}><Text style={styles.textLabel}>사진 1장 · 2초 영상</Text><Text style={styles.textCaption}>리캡 업로드는 다음 단계에서 연결해요</Text></View><Plus size={20} color={color.inkMuted} /></Pressable><PrimaryAction label={remote ? '체크 저장' : '모든 멤버에게 확인 요청'} icon={Users} loading={busy} onPress={submit} disabled={busy} /></ScreenContainer>;
}

export function ReviewsScreen({ model, back }: Omit<NavProps, 'navigate'>) {
  const pending = model.data.records.filter((record) => record.state === 'pending' && record.ownerId !== 'me'); const mine = model.data.records.filter((record) => record.ownerId === 'me'); const [selected, setSelected] = useState<GoalRecord | null>(pending[0] ?? null);
  if (selected) return <ScreenContainer><AppHeader title="기록 확인" subtitle={`${selected.ownerName} · 버전 ${selected.version}`} onBack={() => setSelected(null)} /><View style={styles.reviewHero}><Text style={styles.metricLabel}>{goalLabel(selected.kind)}</Text><Text style={styles.metricValue}>{selected.value}{selected.unit}</Text><Text style={styles.textBody}>{selected.note}</Text><Text style={styles.textCaption}>{selected.submittedAt} · {selected.reviewTotal}명 중 {selected.reviewed}명 확인</Text></View><InlineNotice title="기록 내용과 증거가 충분한지 확인해 주세요" body="설명이 부족하면 미인정보다 설명 요청을 먼저 사용하세요." /><ReviewActions onApprove={() => { model.reviewRecord(selected.id, 'approved'); setSelected(null); }} onQuestion={() => { model.reviewRecord(selected.id, 'changes_requested'); setSelected(null); }} onReject={() => { model.reviewRecord(selected.id, 'rejected'); setSelected(null); }} /></ScreenContainer>;
  return <ScreenContainer><AppHeader title="기록 확인" subtitle="내가 할 일과 내 기록 상태" onBack={back} /><SectionHeader title="내 확인이 필요해요" detail={`${pending.length}건`} /><View style={styles.list}>{pending.length ? pending.map((record) => <ConfirmationRow key={record.id} record={record} onOpen={() => setSelected(record)} />) : <EmptyState title="모두 확인했어요" body="확인 대기 중인 친구 기록이 없습니다." />}</View><View style={styles.section}><SectionHeader title="내 제출 기록" detail="확정 전 기록은 주간 실적에 포함되지 않아요" />{mine.map((record) => <View key={record.id} style={styles.ownRecord}><View style={styles.flex}><Text style={styles.textLabel}>{record.value}{record.unit} · 버전 {record.version}</Text><Text style={styles.textCaption}>{record.note}</Text></View><StatusBadge label={record.state === 'confirmed' ? '확정' : record.state === 'changes_requested' ? '설명 요청' : `${record.reviewTotal}명 중 ${record.reviewed}명 확인`} tone={record.state === 'confirmed' ? 'success' : record.state === 'changes_requested' ? 'danger' : 'warning'} /></View>)}</View></ScreenContainer>;
}

export function ResultsScreen({ model, back }: Omit<NavProps, 'navigate'>) {
  const league = model.data.league; if (!league) return null;
  const sorted = [...league.members].sort((a, b) => b.confirmed - a.confirmed); const missed = sorted.filter((member) => member.confirmed < league.target); const pool = missed.length * league.penaltyWon; const fee = Math.round(pool * 0.01); const distributable = pool - fee;
  return <ScreenContainer><AppHeader title="3주차 결과" subtitle="확정 기록 기준 · 예상 정산" onBack={back} /><View style={styles.scoreboard}><Text style={styles.scoreboardLabel}>이번 주 예상 페널티 풀</Text><Text style={styles.scoreboardValue}>{pool.toLocaleString()}원</Text><Text style={styles.scoreboardMeta}>수수료 {fee.toLocaleString()}원 · 분배 대상 {distributable.toLocaleString()}원</Text></View><View style={styles.list}>{sorted.map((member, index) => <View key={member.id} style={styles.rank}><Text style={styles.rankNo}>{index + 1}</Text><View style={[styles.smallAvatar, { backgroundColor: member.color }]}><Text style={[styles.initial, { color: onChip(member.color) }]}>{member.initials}</Text></View><View style={styles.flex}><Text style={styles.textLabel}>{member.name}{member.isMe ? ' · 나' : ''}</Text><Text style={styles.textCaption}>{formatValue(member.confirmed, league.unit)} · {Math.round(member.confirmed / league.target * 100)}%</Text></View><Text style={styles.reward}>{member.confirmed >= league.target ? `+${Math.round(distributable * (league.rankWeights[index] ?? 0) / 100).toLocaleString()}원` : `-${league.penaltyWon.toLocaleString()}원`}</Text></View>)}</View><InlineNotice title="실제 결제나 송금이 아닌 예상 계산입니다" body="동점은 해당 순위들의 비율을 합산한 뒤 동점자에게 균등 분배합니다." /></ScreenContainer>;
}

export function RecapScreen({ model, back, navigate }: NavProps) {
  const confirmed = model.data.records.filter((record) => record.state === 'confirmed');
  return <ScreenContainer><AppHeader title="주간 리캡" subtitle="확정된 순간만 모아 보는 비공개 기록" onBack={back} /><RecapPreview hasMedia={confirmed.length > 0} onPress={() => navigate('capture')} /><View style={styles.section}><SectionHeader title="3주차 타임라인" detail={`${confirmed.length}개 기록 · 날짜순`} />{confirmed.length ? confirmed.map((record) => <View key={record.id} style={styles.timeline}><View style={styles.timelineDot} /><View style={styles.flex}><Text style={styles.textLabel}>{record.ownerName} · {record.value}{record.unit}</Text><Text style={styles.textCaption}>{record.submittedAt} · {record.note}</Text></View></View>) : <EmptyState title="아직 리캡에 담긴 순간이 없어요" body="기록이 전원 확인되면 사진과 영상이 이곳에 날짜순으로 나타납니다." action="촬영하기" onAction={() => navigate('capture')} />}</View></ScreenContainer>;
}

export function ExtensionScreen({ model, back, navigate }: NavProps) {
  const [weeks, setWeeks] = useState(2); const [vote, setVote] = useState<'none' | 'yes' | 'no'>('none');
  return <ScreenContainer><AppHeader title="리그 연장" subtitle="마지막 주 · 전원 동의가 필요합니다" onBack={back} /><View style={styles.ruleHeader}><Flag size={25} color={color.orange} /><View style={styles.flex}><Text style={styles.ruleHeading}>이 흐름을 조금 더 이어갈까요?</Text><Text style={styles.ruleCaption}>거절하거나 응답하지 않으면 기존 일정대로 종료됩니다.</Text></View></View><Stepper label="추가 기간" value={weeks} unit="주" min={1} max={8} onChange={setWeeks} /><View style={styles.votes}><ReadOnlyRow label="다솜" value={vote === 'yes' ? '동의' : vote === 'no' ? '거절' : '응답 전'} /><ReadOnlyRow label="준호" value="동의" /><ReadOnlyRow label="소연" value="응답 전" /><ReadOnlyRow label="민재" value="동의" /></View><View style={styles.twoActions}><PrimaryAction label="연장 동의" icon={Check} onPress={() => setVote('yes')} /><PrimaryAction label="이번에 종료" icon={Flag} tone="quiet" onPress={() => setVote('no')} /></View>{vote === 'yes' ? <InlineNotice title="동의를 기록했어요" body="남은 한 명이 동의하면 종료 주차가 자동으로 연장됩니다." tone="success" /> : null}<Pressable onPress={() => { model.setLeagueState('completed'); navigate('home'); }} style={styles.textAction}><Text style={styles.dangerLink}>미응답으로 기존 일정 종료 미리보기</Text></Pressable></ScreenContainer>;
}

export function ProfileScreen({ model, back, navigate }: NavProps) {
  const [busy, setBusy] = useState(false); const [blocked, setBlocked] = useState(false);
  const togglePush = async () => { setBusy(true); await model.requestPush(); setBusy(false); };
  const confirmDelete = () => Alert.alert('계정을 탈퇴할까요?', '프로필 접근은 즉시 중단되며 법적 보존 의무가 없는 데이터는 삭제 절차에 들어갑니다.', [{ text: '취소', style: 'cancel' }, { text: '탈퇴', style: 'destructive', onPress: model.deleteAccount }]);
  return <ScreenContainer><AppHeader title="내 프로필" subtitle="계정·알림·안전 설정" onBack={back} /><View style={styles.profile}><View style={styles.profileAvatar}><Text style={styles.profileInitial}>{model.data.nickname.slice(0, 1)}</Text></View><View style={styles.flex}><Text style={styles.profileHeading}>{model.data.nickname}</Text><Text style={styles.textCaption}>{model.authUserId ? '서버에 연결된 계정' : '로컬 화면만 보는 중'}</Text></View></View><SectionHeader title="알림" detail="확인 요청과 마감만 꼭 필요한 시점에 보내요" /><View style={styles.setting}><Bell size={20} color={color.blue} /><View style={styles.flex}><Text style={styles.textLabel}>푸시 알림</Text><Text style={styles.textCaption}>{busy ? '권한 확인 중…' : model.data.pushEnabled ? '허용됨' : '허용하지 않음'}</Text></View><Switch accessibilityLabel="푸시 알림" value={model.data.pushEnabled} onValueChange={togglePush} trackColor={{ false: color.surfaceMuted, true: color.aqua }} thumbColor={color.surface} /></View><SectionHeader title="안전" detail="신고와 차단은 서로 다른 조치입니다" /><Pressable style={styles.setting} onPress={() => setBlocked((value) => !value)}><UserMinus size={20} color={color.orange} /><View style={styles.flex}><Text style={styles.textLabel}>민재 {blocked ? '차단 해제' : '차단'}</Text><Text style={styles.textCaption}>차단하면 서로의 새 리그 초대가 보이지 않아요</Text></View></Pressable><Pressable style={styles.setting} onPress={() => Alert.alert('신고가 접수되었습니다', '관리자가 기록과 감사 로그를 확인합니다.')}><MessageSquareWarning size={20} color={color.danger} /><View style={styles.flex}><Text style={styles.textLabel}>사용자 또는 기록 신고</Text><Text style={styles.textCaption}>괴롭힘, 허위 기록, 부적절한 미디어</Text></View></Pressable><SectionHeader title="앱 점검" /><Pressable style={styles.setting} onPress={() => navigate('states')}><AlertTriangle size={20} color={color.orange} /><Text style={[styles.textLabel, styles.flex]}>상태·반응형 QA 보기</Text></Pressable><Pressable style={styles.setting} onPress={() => navigate('admin')}><ShieldCheck size={20} color={color.blue} /><Text style={[styles.textLabel, styles.flex]}>관리자 도구 미리보기</Text></Pressable><Pressable style={styles.setting} onPress={() => { void model.signOut(); }}><LogOut size={20} color={color.inkMuted} /><Text style={[styles.textLabel, styles.flex]}>로그아웃</Text></Pressable><Pressable style={styles.setting} onPress={confirmDelete}><Trash2 size={20} color={color.danger} /><Text style={[styles.textLabel, styles.flex, { color: color.danger }]}>회원 탈퇴</Text></Pressable></ScreenContainer>;
}

export function AdminScreen({ back }: Pick<NavProps, 'back'>) {
  return <ScreenContainer><AppHeader title="운영 점검" subtitle="관리자 역할 전용 · 감사 로그 기록" onBack={back} /><InlineNotice title="프로덕션에서는 관리자 권한이 있는 계정만 접근합니다" body="모든 제한·해제 작업은 감사 로그에 남아야 합니다." tone="warning" /><View style={styles.adminGrid}><AdminMetric label="활성 사용자" value="4" /><AdminMetric label="진행 중 리그" value="1" /><AdminMetric label="승인 교착" value="1" /><AdminMetric label="업로드 실패" value="1" /></View><SectionHeader title="주의가 필요한 항목" /><View style={styles.list}><ReadOnlyRow label="승인 교착" value="준호 기록 · 27시간" /><ReadOnlyRow label="미디어 업로드 실패" value="다솜 · 재시도 2회" /><ReadOnlyRow label="신고" value="처리 대기 1건" /></View><SectionHeader title="최근 감사 로그" /><Text style={styles.textCaption}>09:42 · admin_preview가 신고 #R-104를 조회함</Text><Text style={styles.textCaption}>어제 18:21 · 시스템이 업로드 재시도 작업을 예약함</Text></ScreenContainer>;
}

export function StatesScreen({ model, back }: Pick<NavProps, 'model' | 'back'>) {
  const states: { state: LeagueState; label: string }[] = [{ state: 'agreement', label: '규칙 동의 전' }, { state: 'waiting', label: '인원·시작 대기' }, { state: 'active', label: '진행 중' }, { state: 'last_week', label: '마지막 주' }, { state: 'completed', label: '종료됨' }];
  return <ScreenContainer><AppHeader title="상태 QA" subtitle="제품 상태를 실제 화면에서 점검합니다" onBack={back} /><SectionHeader title="리그 상태" />{states.map((item) => <Pressable key={item.state} onPress={() => model.setLeagueState(item.state)} style={styles.setting}><CheckCircle2 size={19} color={model.data.league?.state === item.state ? color.lime : color.inkMuted} /><Text style={[styles.textLabel, styles.flex]}>{item.label}</Text><StatusBadge label={model.data.league?.state === item.state ? '현재' : '보기'} tone={model.data.league?.state === item.state ? 'success' : 'neutral'} /></Pressable>)}<SectionHeader title="네트워크와 업로드" /><View style={styles.setting}><Text style={[styles.textLabel, styles.flex]}>오프라인</Text><Switch value={model.data.offline} onValueChange={model.setOffline} /></View><InlineNotice title="처리 범위" body="로딩, 서버 오류, 빈 리그, 동의 전, 시작 대기, 타이머, 초안, 승인 대기, 설명 요청, 달성·미달성, 마지막 주, 종료, 리캡 없음, 카메라 거절, 오프라인, 업로드 재시도를 포함합니다." /></ScreenContainer>;
}

function RecognitionGuide({ visible, guide, onClose }: { visible: boolean; guide: GoalGuide; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.guideScrim}>
        <Pressable accessibilityLabel="안내 닫기" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.guideSheet}>
          <View style={styles.guideHead}>
            <View style={styles.flex}>
              <Text style={styles.panelTitle}>{guide.title}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={styles.guideClose}>
              <X size={18} color={color.ink} strokeWidth={2.2} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.guideList}
            contentContainerStyle={styles.guideListContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.guideFormula}>
              <Text style={styles.guideSectionTitle}>한 번에 보기</Text>
              <Text style={styles.guideFormulaText}>{guide.formula}</Text>
            </View>
            <GuideSection title="목표로 정할 수 있어요" lines={[guide.goal]} />
            <GuideSection title="이렇게 기록돼요" lines={guide.rules} />
            <GuideSection title="인정되지 않아요" lines={guide.rejected} />
            {guide.notes?.length ? <GuideSection title="알아두세요" lines={guide.notes} /> : null}
          </ScrollView>
          <PrimaryAction label="확인했어요" icon={Check} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function GuideSection({ title, lines }: { title: string; lines: readonly string[] }) {
  return (
    <View style={styles.guideSection}>
      <Text style={styles.guideSectionTitle}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.guideLine}>{line}</Text>
      ))}
    </View>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string; suffix?: string }) { const { label, suffix, multiline, ...inputProps } = props; return <View style={styles.field}><Text style={styles.textLabel}>{label}</Text><View style={[styles.inputWrap, multiline && styles.multiline]}><TextInput {...inputProps} multiline={multiline} accessibilityLabel={label} placeholderTextColor={color.inkMuted} style={[styles.input, multiline && styles.inputMultiline]} />{suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}</View></View>; }
function ReadOnlyRow({ label, value }: { label: string; value: string }) { return <View style={styles.readRow}><Text style={styles.readLabel}>{label}</Text><Text style={styles.readValue}>{value}</Text></View>; }
function Stepper({ label, value, unit, min, max, onChange }: { label: string; value: number; unit: string; min: number; max: number; onChange: (value: number) => void }) { return <View style={styles.readRow}><Text style={styles.readLabel}>{label}</Text><View style={styles.stepper}><Pressable accessibilityLabel={`${label} 줄이기`} style={styles.step} onPress={() => onChange(Math.max(min, value - 1))}><Text style={styles.stepText}>−</Text></Pressable><Text style={styles.stepValue}>{value}{unit}</Text><Pressable accessibilityLabel={`${label} 늘리기`} style={styles.step} onPress={() => onChange(Math.min(max, value + 1))}><Text style={styles.stepText}>+</Text></Pressable></View></View>; }
function Choice({ active, label, icon: Icon, onPress }: { active: boolean; label: string; icon?: typeof Clock3; onPress: () => void }) { return <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.choice, active && styles.choiceActive]}>{Icon ? <Icon size={19} color={active ? color.white : color.blue} /> : null}<Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>; }
function AdminMetric({ label, value }: { label: string; value: string }) { return <View style={styles.adminMetric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.textCaption}>{label}</Text></View>; }

const styles = StyleSheet.create({
  flex: { flex: 1 }, stack: { gap: space.x2 }, section: { marginTop: space.x8 }, bottomAction: { marginTop: space.x6 }, twoActions: { gap: space.x2 }, textAction: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: space.x3 }, link: { color: color.ink, ...typography.label }, dangerLink: { color: color.danger, ...typography.label },
  auth: { minHeight: 720, justifyContent: 'center', gap: space.x6, paddingVertical: space.x8 }, authCopy: { gap: space.x4, alignItems: 'center' }, authLogo: { width: 240, height: 88 }, authTagline: { color: color.inkMuted, ...typography.caption, textAlign: 'center' }, authDisplay: { color: color.ink, ...typography.screenTitle }, panelTitle: { color: color.ink, ...typography.sectionTitle }, profileHeading: { color: color.ink, ...typography.sectionTitle }, textBody: { color: color.inkMuted, ...typography.body }, textLabel: { color: color.ink, ...typography.label }, textCaption: { color: color.inkMuted, ...typography.caption }, legal: { color: color.inkMuted, ...typography.caption, textAlign: 'center' }, ruleHeading: { color: color.white, ...typography.sectionTitle }, ruleCaption: { color: '#CBD5E1', ...typography.caption },
  segment: { flexDirection: 'row', gap: space.x2, marginBottom: space.x2, flexWrap: 'wrap' }, choice: { minHeight: 48, paddingHorizontal: space.x4, borderRadius: radius.input, borderWidth: 1, borderColor: color.borderSubtle, backgroundColor: color.surface, flexDirection: 'row', alignItems: 'center', gap: space.x2 }, choiceActive: { backgroundColor: color.blue, borderColor: color.blue }, choiceText: { color: color.ink, ...typography.label }, choiceTextActive: { color: color.white, ...typography.button },
  sessionCard: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.borderSubtle, borderRadius: radius.card, padding: space.x4, gap: space.x2, marginBottom: space.x5 },
  sessionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.x3 },
  helpButton: { width: 32, height: 32, borderRadius: radius.round, borderWidth: 1.5, borderColor: color.blue, backgroundColor: color.blueSoft, alignItems: 'center', justifyContent: 'center' },
  form: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.borderSubtle, borderRadius: radius.card, padding: space.x4, gap: space.x4, marginBottom: space.x5 }, field: { gap: space.x2 }, inputWrap: { minHeight: 52, borderWidth: 1, borderColor: color.borderSubtle, borderRadius: radius.input, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBFAF7' }, input: { flex: 1, minHeight: 50, paddingHorizontal: space.x4, color: color.ink, ...typography.body }, suffix: { color: color.inkMuted, ...typography.label, paddingRight: space.x4 }, multiline: { minHeight: 126, alignItems: 'flex-start' }, inputMultiline: { minHeight: 124, textAlignVertical: 'top', paddingTop: space.x3 },
  readRow: { minHeight: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.x3, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.borderSubtle }, readLabel: { color: color.inkMuted, ...typography.body, flex: 1 }, readValue: { color: color.ink, ...typography.label, textAlign: 'right', flexShrink: 1 }, stepper: { flexDirection: 'row', alignItems: 'center', gap: space.x2 }, step: { width: 40, height: 40, borderRadius: radius.control, borderWidth: 1, borderColor: color.borderSubtle, alignItems: 'center', justifyContent: 'center' }, stepText: { color: color.ink, ...typography.statMD }, stepValue: { minWidth: 44, color: color.ink, ...typography.label, textAlign: 'center' },
  ruleHeader: { padding: space.x5, borderRadius: radius.league, backgroundColor: color.ink, flexDirection: 'row', gap: space.x3, alignItems: 'center', marginBottom: space.x5 }, checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.x3, minHeight: 52, marginBottom: space.x4 }, checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: color.inkMuted, alignItems: 'center', justifyContent: 'center' }, checkboxOn: { backgroundColor: color.lime, borderColor: color.lime },
  metric: { backgroundColor: color.blueSoft, padding: space.x5, borderRadius: radius.card, marginBottom: space.x5 }, metricLabel: { color: color.inkMuted, ...typography.caption }, metricValue: { color: color.ink, ...typography.statLG }, mediaRow: { minHeight: 72, borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.borderSubtle, flexDirection: 'row', gap: space.x3, alignItems: 'center', marginVertical: space.x5 },
  timerPanel: { backgroundColor: color.ink, borderRadius: radius.league, paddingVertical: space.x10, paddingHorizontal: space.x5, alignItems: 'center', marginBottom: space.x5 }, timerRound: { color: color.aqua, ...typography.label }, timer: { color: color.white, ...typography.statXL, fontVariant: ['tabular-nums'], marginTop: space.x3 }, timerState: { color: '#CBD5E1', ...typography.caption }, timerControls: { flexDirection: 'row', gap: space.x3, marginTop: space.x8 }, timerMain: { width: 60, height: 60, borderRadius: radius.round, backgroundColor: color.aqua, alignItems: 'center', justifyContent: 'center' }, timerFinish: { height: 60, borderRadius: radius.input, backgroundColor: color.orange, paddingHorizontal: space.x6, flexDirection: 'row', gap: space.x2, alignItems: 'center' }, timerFinishText: { color: color.white, ...typography.button },
  list: { backgroundColor: color.surface, borderRadius: radius.card, borderWidth: 1, borderColor: color.borderSubtle, paddingHorizontal: space.x4 }, reviewHero: { backgroundColor: color.surface, borderRadius: radius.card, borderWidth: 1, borderColor: color.borderSubtle, padding: space.x5, gap: space.x3, marginBottom: space.x4 }, ownRecord: { minHeight: 72, flexDirection: 'row', gap: space.x3, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.borderSubtle },
  scoreboard: { backgroundColor: color.ink, borderRadius: radius.league, padding: space.x5, marginBottom: space.x5 }, scoreboardLabel: { color: '#CBD5E1', ...typography.caption }, scoreboardValue: { color: color.white, ...typography.screenTitle }, scoreboardMeta: { color: color.lime, ...typography.caption, marginTop: space.x2 }, rank: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: space.x3, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.borderSubtle }, rankNo: { color: color.ink, ...typography.cardTitle, width: 20 }, smallAvatar: { width: 34, height: 34, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' }, initial: { color: color.ink, ...typography.label }, reward: { color: color.blue, ...typography.label },
  timeline: { flexDirection: 'row', gap: space.x3, minHeight: 66 }, timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.orange, marginTop: 5 }, votes: { backgroundColor: color.surface, borderRadius: radius.card, borderWidth: 1, borderColor: color.borderSubtle, paddingHorizontal: space.x4, marginVertical: space.x5 },
  profile: { flexDirection: 'row', gap: space.x3, alignItems: 'center', paddingVertical: space.x5 }, profileAvatar: { width: 54, height: 54, borderRadius: radius.round, backgroundColor: color.aqua, alignItems: 'center', justifyContent: 'center' }, profileInitial: { color: color.ink, ...typography.statMD }, setting: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: space.x3, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.borderSubtle },   adminGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2, marginVertical: space.x5 }, adminMetric: { width: '48%', backgroundColor: color.surface, borderWidth: 1, borderColor: color.borderSubtle, borderRadius: radius.input, padding: space.x4 },
  guideScrim: { flex: 1, backgroundColor: color.scrim, justifyContent: 'flex-end' },
  guideSheet: { maxHeight: '86%', backgroundColor: color.surface, borderTopLeftRadius: radius.league, borderTopRightRadius: radius.league, paddingHorizontal: space.x5, paddingTop: space.x5, paddingBottom: space.x8, gap: space.x3 },
  guideHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.x3 },
  guideClose: { width: 36, height: 36, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceMuted },
  guideList: { flexGrow: 0 },
  guideListContent: { paddingBottom: space.x2, gap: space.x5 },
  guideFormula: { backgroundColor: color.blueSoft, borderRadius: radius.input, padding: space.x4, gap: space.x2 },
  guideFormulaText: { color: color.ink, ...typography.cardTitle },
  guideSection: { gap: space.x2 },
  guideSectionTitle: { color: color.ink, ...typography.label },
  guideLine: { color: color.inkMuted, ...typography.body },
});
