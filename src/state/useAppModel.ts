import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as ExpoLinking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { initialSnapshot } from '../data/seed';
import { AppSnapshot, GoalRecord, LeagueState, ReviewDecision } from '../types/domain';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const STORAGE_KEY = '4better:v1:snapshot';

export function useAppModel() {
  const [data, setData] = useState<AppSnapshot>(initialSnapshot);
  const [hydrated, setHydrated] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setData({ ...initialSnapshot, ...JSON.parse(raw) }))
      .catch(() => setServerError('저장된 데이터를 불러오지 못했어요.'))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => setServerError('변경사항을 저장하지 못했어요.'));
  }, [data, hydrated]);

  const timerSeconds = useMemo(() => {
    if (!data.timerRunning || !data.timerStartedAt) return data.timerAccumulatedSeconds;
    return data.timerAccumulatedSeconds + Math.max(0, Math.floor((Date.now() - new Date(data.timerStartedAt).getTime()) / 1000));
  }, [data.timerAccumulatedSeconds, data.timerRunning, data.timerStartedAt]);

  const update = useCallback((patch: Partial<AppSnapshot>) => setData((current) => ({ ...current, ...patch })), []);
  const signIn = (nickname: string) => update({ nickname: nickname.trim() || '새 멤버', signedIn: true });
  const signInSocial = async (provider: 'google' | 'apple', nickname: string) => {
    if (!isSupabaseConfigured || !supabase) { signIn(nickname); return { preview: true } as const; }
    const { data: oauth, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: ExpoLinking.createURL('auth/callback'), skipBrowserRedirect: true } });
    if (error) throw error;
    if (oauth.url) await ExpoLinking.openURL(oauth.url);
    return { preview: false } as const;
  };
  const signOut = () => update({ signedIn: false });
  const deleteAccount = async () => { await AsyncStorage.removeItem(STORAGE_KEY); setData({ ...initialSnapshot, signedIn: false }); };
  const setLeagueState = (state: LeagueState) => setData((current) => ({ ...current, league: current.league ? { ...current.league, state } : null }));

  const startTimer = () => update({ timerRunning: true, timerStartedAt: new Date().toISOString() });
  const pauseTimer = () => setData((current) => ({ ...current, timerRunning: false, timerStartedAt: null, timerAccumulatedSeconds: timerSeconds }));
  const finishTimer = () => {
    pauseTimer();
    const record: GoalRecord = { id: `local-${Date.now()}`, ownerId: 'me', ownerName: data.nickname, kind: 'focus_timer', value: Math.max(1, Math.floor(timerSeconds / 60)), unit: '분', note: '', version: 1, state: 'draft', reviewed: 0, reviewTotal: Math.max(1, (data.league?.members.length ?? 2) - 1), submittedAt: '방금' };
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
    const permission = await Notifications.requestPermissionsAsync();
    const enabled = permission.status === 'granted';
    update({ pushEnabled: enabled });
    return enabled;
  };
  const retryUpload = (id: string) => setData((current) => ({ ...current, records: current.records.map((r) => r.id === id ? { ...r, state: 'pending' } : r) }));
  const setOffline = (offline: boolean) => update({ offline });

  return { data, hydrated, serverError, clearError: () => setServerError(null), timerSeconds, signIn, signInSocial, signOut, deleteAccount, update, setLeagueState, startTimer, pauseTimer, finishTimer, submitRecord, createCreativeRecord, reviewRecord, requestPush, retryUpload, setOffline };
}

export type AppModel = ReturnType<typeof useAppModel>;
