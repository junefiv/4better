import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Camera, ClipboardCheck, Home, Menu, Settings, X } from 'lucide-react-native';
import { color, elevation, layout, radius, space, type } from '../design/tokens';
import { Route } from '../types/domain';

const items: { route: Route; label: string; icon: typeof Home }[] = [
  { route: 'home', label: '홈', icon: Home },
  { route: 'reviews', label: '확인', icon: ClipboardCheck },
  { route: 'recap', label: '리캡', icon: Camera },
  { route: 'profile', label: '설정', icon: Settings },
];

export function FloatingMenu({ current, navigate }: { current: Route; navigate: (route: Route) => void }) {
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const right = Math.max(space.x4, (width - Math.min(width, width >= 900 ? layout.desktopMax : width >= 600 ? layout.tabletMax : width)) / 2 + space.x4);
  const choose = (route: Route) => { setOpen(false); navigate(route); };
  return (
    <View pointerEvents="box-none" style={[styles.host, { right }]}>
      {open ? <View style={styles.menu} accessibilityRole="menu">
        {items.map(({ route, label, icon: Icon }) => <Pressable accessibilityRole="menuitem" key={route} onPress={() => choose(route)} style={({ pressed }) => [styles.item, route === current && styles.selected, pressed && styles.pressed]}><Icon size={18} color={route === current ? color.white : color.ink} /><Text style={[styles.itemText, route === current && styles.selectedText]}>{label}</Text></Pressable>)}
      </View> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={open ? '메뉴 닫기' : '메뉴 열기'} accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>{open ? <X size={23} color={color.white} /> : <Menu size={23} color={color.white} />}</Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', bottom: 24, alignItems: 'flex-end', gap: space.x2, zIndex: 20 },
  menu: { width: 168, backgroundColor: color.surface, borderRadius: radius.card, padding: space.x2, borderWidth: 1, borderColor: color.borderSubtle, ...elevation },
  item: { minHeight: 44, borderRadius: radius.control, paddingHorizontal: space.x3, flexDirection: 'row', alignItems: 'center', gap: space.x3 }, selected: { backgroundColor: color.blue },
  itemText: { color: color.ink, ...type.label }, selectedText: { color: color.white },
  trigger: { width: 54, height: 54, borderRadius: 18, backgroundColor: color.blue, alignItems: 'center', justifyContent: 'center', ...elevation }, pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
});
