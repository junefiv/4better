import { ReactNode, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text as RNText, useWindowDimensions, View as RNView } from 'react-native';
import { AlertCircle, ArrowLeft, Bell, Check, ChevronRight, LoaderCircle, Plus } from 'lucide-react-native';
import { styled, Text, View } from '@tamagui/core';
import { color, elevation, layout, radius, space, type } from '../design/tokens';

export const Box = styled(View, { name: 'Box' });
export const Row = styled(View, { name: 'Row', flexDirection: 'row' });
export const Label = styled(Text, { name: 'Label' });

type Icon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export function ScreenContainer({ children, scroll = true, bottomInset = 112 }: { children: ReactNode; scroll?: boolean; bottomInset?: number }) {
  const content = <ResponsiveContent>{children}</ResponsiveContent>;
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset }}>{content}</ScrollView> : content}
    </KeyboardAvoidingView>
  );
}

export function ResponsiveContent({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  const { width } = useWindowDimensions();
  const maxWidth = width >= 900 ? layout.desktopMax : width >= 600 ? layout.tabletMax : undefined;
  const gutter = width < 375 ? layout.smallGutter : layout.mobileGutter;
  return <RNView style={[styles.responsive, { maxWidth, paddingHorizontal: padded ? gutter : 0 }]}>{children}</RNView>;
}

export function AppHeader({ title = '4better', subtitle, onBack, onNotifications, onNew }: { title?: string; subtitle?: string; onBack?: () => void; onNotifications?: () => void; onNew?: () => void }) {
  return (
    <Row alignItems="center" minHeight={64} gap={space.x3} paddingVertical={space.x2}>
      {onBack ? <IconButton label="뒤로" icon={ArrowLeft} onPress={onBack} /> : <Brand compact />}
      <Box flex={1}>
        {onBack ? <Label color={color.ink} {...type.heading}>{title}</Label> : null}
        {subtitle ? <Label color={color.inkMuted} {...type.caption}>{subtitle}</Label> : null}
      </Box>
      {onNew ? <IconButton label="새 리그" icon={Plus} onPress={onNew} /> : null}
      {onNotifications ? <IconButton label="알림" icon={Bell} onPress={onNotifications} /> : null}
    </Row>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Row alignItems="center" gap={space.x2}>
      <Box width={compact ? 30 : 40} height={compact ? 30 : 40} borderRadius={radius.control} backgroundColor={color.leagueDark} alignItems="center" justifyContent="center">
        <Label color={color.secondary} fontSize={compact ? 16 : 21} fontWeight="900">4</Label>
      </Box>
      <Label color={color.leagueDark} fontSize={compact ? 19 : 25} fontWeight="900" letterSpacing={-0.8}>better</Label>
    </Row>
  );
}

export function IconButton({ label, icon: IconComponent, onPress, filled = false }: { label: string; icon: Icon; onPress?: () => void; filled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress} style={({ pressed }) => [styles.iconButton, filled && styles.iconButtonFilled, pressed && styles.pressed]}><IconComponent size={20} color={filled ? color.white : color.ink} strokeWidth={2} /></Pressable>;
}

export function PrimaryAction({ label, onPress, icon: IconComponent = ChevronRight, disabled = false, loading = false, tone = 'primary', compact = false }: { label: string; onPress: () => void; icon?: Icon; disabled?: boolean; loading?: boolean; tone?: 'primary' | 'dark' | 'quiet' | 'danger'; compact?: boolean }) {
  const background = tone === 'primary' ? color.primary : tone === 'dark' ? color.leagueDark : tone === 'danger' ? color.danger : color.surface;
  const foreground = tone === 'quiet' ? color.ink : tone === 'primary' ? color.ink : color.white;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled, busy: loading }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.action, compact && styles.actionCompact, { backgroundColor: disabled ? color.surfaceMuted : background, borderColor: tone === 'quiet' ? color.borderSubtle : background }, pressed && styles.pressed]}>
      {loading ? <LoaderCircle size={18} color={foreground} /> : null}
      <RNText style={[styles.actionText, { color: disabled ? color.inkMuted : foreground }]}>{label}</RNText>
      {!loading && IconComponent ? <IconComponent size={18} color={disabled ? color.inkMuted : foreground} strokeWidth={2.2} /> : null}
    </Pressable>
  );
}

export function SectionHeader({ title, detail, action, onAction }: { title: string; detail?: string; action?: string; onAction?: () => void }) {
  return (
    <Row alignItems="flex-end" justifyContent="space-between" gap={space.x4} marginBottom={space.x3}>
      <Box flex={1} gap={2}><Label color={color.ink} {...type.heading}>{title}</Label>{detail ? <Label color={color.inkMuted} {...type.caption}>{detail}</Label> : null}</Box>
      {action ? <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}><RNText style={styles.link}>{action}</RNText></Pressable> : null}
    </Row>
  );
}

export function StatusBadge({ label, tone = 'neutral', icon: IconComponent }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'; icon?: Icon }) {
  const tones = { neutral: [color.surfaceMuted, color.inkMuted], success: [color.secondarySoft, color.success], warning: ['#FFF0DB', color.warning], danger: ['#FCE8E6', color.danger], info: ['#E7EDF5', color.leagueDark] } as const;
  const [backgroundColor, foreground] = tones[tone];
  return <Row alignSelf="flex-start" alignItems="center" gap={space.x1} paddingHorizontal={space.x2} paddingVertical={5} borderRadius={radius.control} backgroundColor={backgroundColor}>{IconComponent ? <IconComponent size={13} color={foreground} /> : null}<Label color={foreground} {...type.caption} fontWeight="700">{label}</Label></Row>;
}

export function InlineNotice({ title, body, tone = 'info', action, onAction }: { title: string; body?: string; tone?: 'info' | 'warning' | 'danger' | 'success'; action?: string; onAction?: () => void }) {
  const accent = tone === 'danger' ? color.danger : tone === 'warning' ? color.warning : tone === 'success' ? color.success : color.leagueDark;
  return <Row backgroundColor={color.surface} borderLeftWidth={3} borderLeftColor={accent} padding={space.x4} gap={space.x3} alignItems="flex-start"><AlertCircle size={19} color={accent} /><Box flex={1} gap={3}><Label color={color.ink} {...type.label}>{title}</Label>{body ? <Label color={color.inkMuted} {...type.caption}>{body}</Label> : null}</Box>{action ? <Pressable onPress={onAction}><RNText style={[styles.link, { color: accent }]}>{action}</RNText></Pressable> : null}</Row>;
}

export function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return <Box paddingVertical={space.x10} paddingHorizontal={space.x5} alignItems="center" gap={space.x3}><Box width={44} height={44} borderRadius={radius.round} backgroundColor={color.secondarySoft} alignItems="center" justifyContent="center"><Check size={21} color={color.success} /></Box><Label textAlign="center" color={color.ink} {...type.heading}>{title}</Label><Label textAlign="center" color={color.inkMuted} {...type.body} maxWidth={340}>{body}</Label>{action && onAction ? <PrimaryAction compact label={action} onPress={onAction} /> : null}</Box>;
}

export function ErrorState({ retry }: { retry: () => void }) { return <EmptyState title="잠시 연결이 불안정해요" body="기록은 기기에 안전하게 보관되어 있어요. 연결되면 다시 동기화할게요." action="다시 시도" onAction={retry} />; }

export function Skeleton({ height = 96 }: { height?: number }) {
  const opacity = useRef(new Animated.Value(0.42)).current;
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      animation = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 0.78, duration: 700, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.42, duration: 700, useNativeDriver: true })]));
      animation.start();
    });
    return () => animation?.stop();
  }, [opacity]);
  return <Animated.View accessibilityLabel="불러오는 중" style={{ height, opacity, backgroundColor: color.surfaceMuted, borderRadius: radius.card }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.canvas },
  responsive: { width: '100%', alignSelf: 'center' },
  iconButton: { width: 44, height: 44, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface, borderWidth: 1, borderColor: color.borderSubtle },
  iconButtonFilled: { backgroundColor: color.leagueDark, borderColor: color.leagueDark },
  action: { minHeight: 52, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: space.x4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.x2 },
  actionCompact: { alignSelf: 'flex-start', minHeight: 44 },
  actionText: { ...type.label },
  link: { color: color.leagueDark, ...type.label },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
});

export { elevation };
