import { ReactNode, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text as RNText, useWindowDimensions, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AlertCircle, ArrowLeft, Bell, Check, ChevronRight, LoaderCircle, Plus } from 'lucide-react-native';
import { color, elevation, layout, radius, space, type } from '../design/tokens';

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
  return <View style={[styles.responsive, { maxWidth, paddingHorizontal: padded ? gutter : 0 }]}>{children}</View>;
}

export function AppHeader({ title = '4better', subtitle, onBack, onNotifications, onNew }: { title?: string; subtitle?: string; onBack?: () => void; onNotifications?: () => void; onNew?: () => void }) {
  if (!onBack) {
    return (
      <View style={styles.headerHome}>
        <View style={styles.headerSide} />
        <Brand compact />
        <View style={[styles.headerSide, styles.headerSideEnd]}>
          {onNew ? <IconButton label="새 리그" icon={Plus} onPress={onNew} /> : null}
          {onNotifications ? <IconButton label="알림" icon={Bell} onPress={onNotifications} /> : null}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.header}>
      <IconButton label="뒤로" icon={ArrowLeft} onPress={onBack} />
      <View style={styles.flex}>
        <Text style={[type.heading, styles.ink]}>{title}</Text>
        {subtitle ? <Text style={[type.caption, styles.inkMuted]}>{subtitle}</Text> : null}
      </View>
      {onNew ? <IconButton label="새 리그" icon={Plus} onPress={onNew} /> : null}
      {onNotifications ? <IconButton label="알림" icon={Bell} onPress={onNotifications} /> : null}
    </View>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      source={require('../../assets/logo_4better.png')}
      accessibilityLabel="4better"
      resizeMode="contain"
      style={compact ? styles.brandLogoCompact : styles.brandLogo}
    />
  );
}

export function IconButton({ label, icon: IconComponent, onPress, filled = false }: { label: string; icon: Icon; onPress?: () => void; filled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress} style={({ pressed }) => [styles.iconButton, filled && styles.iconButtonFilled, pressed && styles.pressed]}><IconComponent size={20} color={filled ? color.white : color.blue} strokeWidth={2} /></Pressable>;
}

export function PrimaryAction({ label, onPress, icon: IconComponent = ChevronRight, disabled = false, loading = false, tone = 'primary', compact = false }: { label: string; onPress: () => void; icon?: Icon; disabled?: boolean; loading?: boolean; tone?: 'primary' | 'dark' | 'quiet' | 'danger'; compact?: boolean }) {
  const background = tone === 'primary' ? color.orange : tone === 'dark' ? color.blue : tone === 'danger' ? color.danger : color.surface;
  const foreground = tone === 'quiet' ? color.ink : color.white;
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
    <View style={styles.sectionHeader}>
      <View style={styles.flex}>
        <Text style={[type.heading, styles.ink]}>{title}</Text>
        {detail ? <Text style={[type.caption, styles.inkMuted]}>{detail}</Text> : null}
      </View>
      {action ? <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}><RNText style={styles.link}>{action}</RNText></Pressable> : null}
    </View>
  );
}

export function StatusBadge({ label, tone = 'neutral', icon: IconComponent }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'; icon?: Icon }) {
  const tones = { neutral: [color.surfaceMuted, color.inkMuted], success: [color.limeSoft, color.ink], warning: [color.orangeSoft, color.orange], danger: ['#FCE8E6', color.danger], info: [color.blueSoft, color.blue] } as const;
  const [backgroundColor, foreground] = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      {IconComponent ? <IconComponent size={13} color={foreground} /> : null}
      <Text style={[type.caption, { color: foreground, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
}

export function InlineNotice({ title, body, tone = 'info', action, onAction }: { title: string; body?: string; tone?: 'info' | 'warning' | 'danger' | 'success'; action?: string; onAction?: () => void }) {
  const accent = tone === 'danger' ? color.danger : tone === 'warning' ? color.orange : tone === 'success' ? color.lime : color.blue;
  return (
    <View style={[styles.notice, { borderLeftColor: accent }]}>
      <AlertCircle size={19} color={accent} />
      <View style={styles.flex}>
        <Text style={[type.label, styles.ink]}>{title}</Text>
        {body ? <Text style={[type.caption, styles.inkMuted]}>{body}</Text> : null}
      </View>
      {action ? <Pressable onPress={onAction}><RNText style={[styles.link, { color: accent }]}>{action}</RNText></Pressable> : null}
    </View>
  );
}

export function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Check size={21} color={color.blue} />
      </View>
      <Text style={[type.heading, styles.ink, styles.center]}>{title}</Text>
      <Text style={[type.body, styles.inkMuted, styles.center, styles.emptyBody]}>{body}</Text>
      {action && onAction ? <PrimaryAction compact label={action} onPress={onAction} /> : null}
    </View>
  );
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
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: space.x3, paddingVertical: space.x2 },
  headerHome: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingVertical: space.x2 },
  headerSide: { flex: 1, minHeight: 44 },
  headerSideEnd: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space.x2 },
  flex: { flex: 1, gap: 2 },
  brandLogo: { width: 132, height: 40 },
  brandLogoCompact: { width: 96, height: 28 },
  ink: { color: color.ink },
  inkMuted: { color: color.inkMuted },
  center: { textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.x4, marginBottom: space.x3 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: space.x1, paddingHorizontal: space.x2, paddingVertical: 5, borderRadius: radius.control },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: space.x3, padding: space.x4, backgroundColor: color.surface, borderLeftWidth: 3 },
  empty: { alignItems: 'center', gap: space.x3, paddingVertical: space.x10, paddingHorizontal: space.x5 },
  emptyIcon: { width: 44, height: 44, borderRadius: radius.round, backgroundColor: color.aquaSoft, alignItems: 'center', justifyContent: 'center' },
  emptyBody: { maxWidth: 340 },
  iconButton: { width: 44, height: 44, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface, borderWidth: 1, borderColor: color.borderSubtle },
  iconButtonFilled: { backgroundColor: color.blue, borderColor: color.blue },
  action: { minHeight: 52, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: space.x4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.x2 },
  actionCompact: { alignSelf: 'flex-start', minHeight: 44 },
  actionText: { ...type.label },
  link: { color: color.ink, ...type.label },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
});

export { elevation };
