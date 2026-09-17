import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { initialSnapshot, normalizeSnapshot } from '../data/seed';
import { AppSnapshot, GoalRecord, League, LeagueState, ReviewDecision } from '../types/domain';
import { PREVIEW_LOGIN_EMAIL, previewLoginEmail } from '../lib/previewAuth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { createRemoteLeague, fetchMyLeagues, finishRemoteTimer, isRemoteLeague, pauseRemoteTimer, startRemoteTimer, submitRemoteCheck } from '../lib/remoteLeague';

const STORAGE_KEY = '4better:v1:snapshot';

WebBrowser.maybeCompleteAuthSession();

export function useAppModel() {
  const [data, setData] = useState<AppSnapshot>(initialSnapshot);
  const [hydrated, setHydrated] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [pendingNickname, setPendingNickname] = useState<string | null>(null);
  const [needsNicknameSetup, setNeedsNicknameSetup] = useState(false);

  useEffect(() => {
    let active = true;
    const client = supabase;
    const applySession = async (session: Session | null, fallbackNickname?: string) => {
      if (!active) return;
      setAuthUserId(session?.user.id ?? null);
      if (!session || !client) {
        setData((current) => ({ ...current, signedIn: false }));
        return;
      }

      const { data: profile } = await client
        .from('profiles')
        .select('nickname')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!active) return;
      const metadataName = session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? session.user.user_metadata?.nickname;
      const isPreview = session.user.email === PREVIEW_LOGIN_EMAIL;
      const needsProfile = !isPreview && (!profile?.nickname || profile.nickname === '새 멤버');
      if (needsProfile) {
        setPendingNickname(metadataName ?? '');
        setNeedsNicknameSetup(true);
      }
      const nickname = profile?.nickname ?? fallbackNickname ?? metadataName ?? (isPreview ? '미리보기' : '새 멤버');
      let leagues: League[] = [];
      if (!needsProfile) {
        try {
          leagues = await fetchMyLeagues(session.user.id);
        } catch {
          if (active) setServerError('리그를 불러오지 못했어요.');
        }
      }
      if (!active) return;
      setData((current) => ({
        ...current,
        nickname,
        signedIn: !needsProfile,
        leagues,
        league: leagues.find((item) => item.id === current.league?.id) ?? leagues[0] ?? null,
        records: needsProfile ? current.records : [],
      }));
    };

    const initialize = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? { ...initialSnapshot, ...JSON.parse(raw) } as AppSnapshot : initialSnapshot;
        const previewOnly = {
          ...parsed,
          leagues: (parsed.leagues ?? []).filter((league) => league.id.startsWith('preview-')),
          league: parsed.league?.id.startsWith('preview-') ? parsed.league : null,
        };
        const stored = normalizeSnapshot(previewOnly.leagues?.length ? previewOnly : initialSnapshot);
        if (!active) return;
        setData(stored);
        if (client) {
          const { data: auth, error } = await client.auth.getSession();
          if (error) throw error;
          await applySession(auth.session, stored.nickname);
        }
      } catch {
        if (active) setServerError('저장된 로그인 정보를 불러오지 못했어요.');
      } finally {
        if (active) setHydrated(true);
      }
    };

    initialize();
    const authSubscription = client?.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { void applySession(session); }, 0);
    }).data.subscription;
    const appStateSubscription = client && Platform.OS !== 'web'
      ? AppState.addEventListener('change', (state) => {
          if (state === 'active') client.auth.startAutoRefresh();
          else client.auth.stopAutoRefresh();
        })
      : null;

    return () => {
      active = false;
      authSubscription?.unsubscribe();
      appStateSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => setServerError('변경사항을 저장하지 못했어요.'));
  }, [data, hydrated]);

  const timerSeconds = useMemo(() => {
    if (!data.timerRunning || !data.timerStartedAt) return data.timerAccumulatedSeconds;
    return data.timerAccumulatedSeconds + Math.max(0, Math.floor((Date.now() - new Date(data.timerStartedAt).getTime()) / 1000));
  }, [data.timerAccumulatedSeconds, data.timerRunning, data.timerStartedAt]);

  const update = useCallback((patch: Partial<AppSnapshot>) => setData((current) => {
    const next = { ...current, ...patch };
    if (!patch.league) return next;
    const leagues = next.leagues.some((league) => league.id === patch.league?.id)
      ? next.leagues.map((league) => league.id === patch.league?.id ? patch.league : league)
      : [...next.leagues, patch.league];
    return { ...next, leagues };
  }), []);
  const signIn = (nickname: string) => update({ nickname: nickname.trim() || '새 멤버', signedIn: true });
  const signInPreview = async (idOrEmail: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase 연결 정보가 없어 미리보기 로그인을 할 수 없습니다.');
    }
    const email = previewLoginEmail(idOrEmail);
    if (!email) throw new Error('미리보기 아이디를 확인해 주세요.');
    if (!password) throw new Error('비밀번호를 입력해 주세요.');
    const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('미리보기 이메일이 아직 확인되지 않았어요. Supabase Auth에서 Confirm email을 끄거나 이 계정을 확인 처리해 주세요.');
      }
      if (error.message.toLowerCase().includes('invalid login')) {
        throw new Error('아이디 또는 비밀번호가 맞지 않아요.');
      }
      throw error;
    }
    const user = auth.user ?? auth.session?.user;
    if (!user) throw new Error('미리보기 계정 정보를 받지 못했습니다.');
    setAuthUserId(user.id);
    setPendingNickname(null);
    setNeedsNicknameSetup(false);
    const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).maybeSingle();
    const nickname = profile?.nickname && profile.nickname !== '새 멤버' ? profile.nickname : '미리보기';
    if (!profile?.nickname || profile.nickname === '새 멤버') {
      await supabase.from('profiles').upsert({
        id: user.id,
        nickname,
        updated_at: new Date().toISOString(),
      });
    }
    let leagues: League[] = [];
    try {
      leagues = await fetchMyLeagues(user.id);
    } catch {
      setServerError('리그를 불러오지 못했어요.');
    }
    update({ nickname, signedIn: true, leagues, league: leagues[0] ?? null, records: [] });
    return { authenticated: true as const };
  };
  const signInSocial = async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase 연결 정보가 없어 Google 로그인을 시작할 수 없습니다.');
    }

    const redirectTo = ExpoLinking.createURL('auth/callback');
    const { data: oauth, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    if (!oauth.url) throw new Error('인증 URL을 만들지 못했습니다.');

    const browserResult = await WebBrowser.openAuthSessionAsync(oauth.url, redirectTo);
    if (browserResult.type !== 'success') {
      return { preview: false, authenticated: false, cancelled: true } as const;
    }

    if (!browserResult.url) throw new Error('Google 로그인 결과 주소를 받지 못했습니다. 다시 시도해 주세요.');
    const callback = ExpoLinking.parse(browserResult.url);
    const queryValue = (key: string) => {
      const value = callback.queryParams?.[key];
      return Array.isArray(value) ? value[0] : value == null ? null : String(value);
    };
    const callbackError = queryValue('error_description') ?? queryValue('error');
    if (callbackError) throw new Error(callbackError);
    const code = queryValue('code');
    if (!code) throw new Error('Google 인증 코드가 없습니다.');

    const { data: auth, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    const user = auth.user ?? auth.session?.user;
    if (!user) throw new Error('Google 계정 정보를 받지 못했습니다. 다시 시도해 주세요.');
    const suggestedNickname = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
    setAuthUserId(user.id);
    setPendingNickname(suggestedNickname);
    setNeedsNicknameSetup(true);
    update({ nickname: suggestedNickname || '새 멤버', signedIn: false });
    return { preview: false, authenticated: true, cancelled: false, suggestedNickname } as const;
  };
  const completeSocialProfile = async (nickname: string) => {
    if (!supabase || !authUserId) throw new Error('로그인 세션을 찾지 못했습니다. Google 로그인을 다시 시도해 주세요.');
    const safeNickname = nickname.trim();
    if (safeNickname.length < 2 || safeNickname.length > 20) throw new Error('닉네임은 2~20자로 입력해 주세요.');
    const { data: auth, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!auth.user) throw new Error('Google 계정 정보를 불러오지 못했습니다. 다시 로그인해 주세요.');
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: auth.user.id,
      nickname: safeNickname,
      avatar_url: auth.user.user_metadata?.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    });
    if (profileError) throw profileError;
    setPendingNickname(null);
    setNeedsNicknameSetup(false);
    update({ nickname: safeNickname, signedIn: true });
  };
  const signOut = async () => {
    if (supabase && authUserId) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setAuthUserId(null);
    setPendingNickname(null);
    setNeedsNicknameSetup(false);
    setData((current) => ({ ...normalizeSnapshot(initialSnapshot), nickname: current.nickname, signedIn: false }));
  };
  const deleteAccount = async () => {
    if (supabase && authUserId) await supabase.auth.signOut();
    await AsyncStorage.removeItem(STORAGE_KEY);
    setAuthUserId(null);
    setPendingNickname(null);
    setNeedsNicknameSetup(false);
    setData({ ...initialSnapshot, signedIn: false });
  };
  const setLeagueState = (state: LeagueState) => setData((current) => {
    if (!current.league) return current;
    const league = { ...current.league, state };
    return { ...current, league, leagues: current.leagues.map((item) => item.id === league.id ? league : item) };
  });
  const selectLeague = (league: League) => setData((current) => ({ ...current, league }));
  const refreshLeagues = useCallback(async (preferredId?: string) => {
    if (!authUserId) return [];
    const leagues = await fetchMyLeagues(authUserId);
    setData((current) => ({
      ...current,
      leagues,
      league: leagues.find((item) => item.id === (preferredId ?? current.league?.id)) ?? leagues[0] ?? null,
    }));
    return leagues;
  }, [authUserId]);
  const createLeague = async (input: { name: string; kind: League['kind']; weeklyTarget: number; unit: string; plannedWeeks: number; rankWeights: number[] }) => {
    const id = await createRemoteLeague(input);
    const leagues = await refreshLeagues(id);
    return leagues.find((item) => item.id === id) ?? null;
  };
  const submitCheck = async (value: number, note = '') => {
    const weekId = data.league?.weekId;
    if (!weekId) throw new Error('WEEK_NOT_FOUND');
    const id = await submitRemoteCheck(weekId, value, note);
    await refreshLeagues(data.league?.id);
    return id;
  };

  const startTimer = async () => {
    if (isRemoteLeague(data.league) && data.league?.weekId) await startRemoteTimer(data.league.weekId);
    update({ timerRunning: true, timerStartedAt: new Date().toISOString() });
  };
  const pauseTimer = async () => {
    let accumulated = timerSeconds;
    if (isRemoteLeague(data.league)) accumulated = await pauseRemoteTimer();
    setData((current) => ({ ...current, timerRunning: false, timerStartedAt: null, timerAccumulatedSeconds: accumulated }));
  };
  const finishTimer = async (note = '') => {
    if (isRemoteLeague(data.league)) {
      const id = await finishRemoteTimer(note);
      setData((current) => ({ ...current, timerRunning: false, timerStartedAt: null, timerAccumulatedSeconds: 0 }));
      await refreshLeagues(data.league?.id);
      return id;
    }
    const record: GoalRecord = { id: `local-${Date.now()}`, ownerId: 'me', ownerName: data.nickname, kind: data.league?.kind ?? 'study', value: Math.max(1, Math.floor(timerSeconds / 60)), unit: '분', note, version: 1, state: 'draft', reviewed: 0, reviewTotal: Math.max(1, (data.league?.members.length ?? 2) - 1), submittedAt: '방금' };
    setData((current) => ({ ...current, records: [record, ...current.records], timerRunning: false, timerStartedAt: null, timerAccumulatedSeconds: 0 }));
    return record.id;
  };
  const submitRecord = (id: string, note: string) => setData((current) => ({ ...current, records: current.records.map((r) => r.id === id ? { ...r, note, state: 'pending', version: r.state === 'changes_requested' ? r.version + 1 : r.version, submittedAt: '방금' } : r) }));
  const createCreativeRecord = (kind: 'writing' | 'drawing', note: string) => {
    const id = `local-${Date.now()}`;
    const record: GoalRecord = { id, ownerId: 'me', ownerName: data.nickname, kind, value: 1, unit: '회', note, version: 1, state: 'pending', reviewed: 0, reviewTotal: Math.max(1, (data.league?.members.length ?? 2) - 1), submittedAt: '방금' };
    setData((current) => ({ ...current, records: [record, ...current.records] }));
    return id;
  };
  const reviewRecord = async (id: string, decision: ReviewDecision) => {
    setData((current) => ({ ...current, records: current.records.map((r) => r.id !== id ? r : decision === 'approved' ? { ...r, reviewed: Math.min(r.reviewTotal, r.reviewed + 1), state: r.reviewed + 1 >= r.reviewTotal ? 'confirmed' : 'pending' } : { ...r, state: decision === 'rejected' ? 'rejected' : 'changes_requested' }) }));
    if (Platform.OS !== 'web') await Haptics.notificationAsync(decision === 'approved' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
  };
  const requestPush = async () => {
    try {
      // Expo Go for Android no longer ships the native push module. Loading it
      // lazily keeps Expo Go usable while retaining push support in dev/release builds.
      const Notifications = await import('expo-notifications');
      const permission = await Notifications.requestPermissionsAsync();
      const enabled = permission.status === 'granted';
      update({ pushEnabled: enabled });
      return enabled;
    } catch {
      setServerError('Expo Go에서는 푸시 알림 테스트를 지원하지 않아요. 개발 빌드에서 확인해 주세요.');
      update({ pushEnabled: false });
      return false;
    }
  };
  const retryUpload = (id: string) => setData((current) => ({ ...current, records: current.records.map((r) => r.id === id ? { ...r, state: 'pending' } : r) }));
  const setOffline = (offline: boolean) => update({ offline });

  return { data, hydrated, serverError, authUserId, pendingNickname, needsNicknameSetup, clearError: () => setServerError(null), timerSeconds, signIn, signInPreview, signInSocial, completeSocialProfile, signOut, deleteAccount, update, setLeagueState, selectLeague, refreshLeagues, createLeague, submitCheck, startTimer, pauseTimer, finishTimer, submitRecord, createCreativeRecord, reviewRecord, requestPush, retryUpload, setOffline };
}

export type AppModel = ReturnType<typeof useAppModel>;
