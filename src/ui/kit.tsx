import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { C, F, S } from './theme';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({ name, size = 24, color = C.text }: { name: string; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name as IconName} size={size} color={color} />;
}

export function Screen({ title, sub, children, right }: { title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
        <View style={st.head}>
          <View style={{ flex: 1 }}>
            <Text style={st.title} accessibilityRole="header">{title}</Text>
            {sub ? <Text style={st.sub}>{sub}</Text> : null}
          </View>
          {right}
        </View>
        <View style={st.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress, label }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; label?: string }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [st.card, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  return <View style={[st.card, style]}>{children}</View>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={st.h2}>{children}</Text>;
}

export function P({ children, dim, style }: { children: React.ReactNode; dim?: boolean; style?: object }) {
  return <Text style={[st.p, dim && { color: C.dim }, style]}>{children}</Text>;
}

export function Button({ title, onPress, kind = 'main', icon, disabled }: { title: string; onPress: () => void; kind?: 'main' | 'ghost' | 'danger'; icon?: string; disabled?: boolean }) {
  const main = kind === 'main';
  const col = main ? C.bg : kind === 'danger' ? '#F2A7A0' : C.gold;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [st.btn, main ? st.btnMain : st.btnGhost, kind === 'danger' && { borderColor: '#F2A7A0' }, (pressed || disabled) && { opacity: disabled ? 0.45 : 0.8 }]}
    >
      {icon ? <Icon name={icon} size={20} color={col} /> : null}
      <Text style={[st.btnText, { color: col }]}>{title}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.label}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor="rgba(194,187,168,0.6)" {...rest} style={[st.input, style]} />
    </View>
  );
}

export function Bar({ value, color = C.gold, height = 10 }: { value: number; color?: string; height?: number }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: 'rgba(243,235,214,0.12)', overflow: 'hidden' }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}>
      <View style={{ width: `${v * 100}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function Ring({ value, size = 92, label }: { value: number; size?: number; label: string }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill as object}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(243,235,214,0.14)" strokeWidth={8} fill="none" />
        {v > 0 ? <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.gold} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} /> : null}
      </Svg>
      <Text style={{ fontFamily: F.title, color: C.text, fontSize: 20 }}>{label}</Text>
    </View>
  );
}

/** Platzhalter-Glas, bis die gemalten Gläser da sind. level 0–4. */
export function JarPicture({ color, level, size = 84 }: { color: string; level: number; size?: number }) {
  const w = size;
  const h = size * 1.18;
  const top = h * 0.2;
  const bottom = h * 0.96;
  const fillTop = bottom - (bottom - top - 6) * (level / 4);
  const id = 'g' + color.replace('#', '') + level;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} accessibilityLabel="Glas">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.95" />
          <Stop offset="1" stopColor={color} stopOpacity="0.55" />
        </LinearGradient>
      </Defs>
      <Rect x={w * 0.3} y={h * 0.04} width={w * 0.4} height={h * 0.1} rx={4} fill="#8A6A3A" />
      <Path d={`M${w * 0.26} ${top} Q${w * 0.06} ${top + 6} ${w * 0.08} ${h * 0.45} L${w * 0.1} ${bottom - 8} Q${w * 0.12} ${bottom} ${w * 0.3} ${bottom} L${w * 0.7} ${bottom} Q${w * 0.88} ${bottom} ${w * 0.9} ${bottom - 8} L${w * 0.92} ${h * 0.45} Q${w * 0.94} ${top + 6} ${w * 0.74} ${top} Z`} fill="rgba(243,235,214,0.08)" stroke="rgba(243,235,214,0.55)" strokeWidth={2} />
      {level > 0 ? <Rect x={w * 0.12} y={fillTop} width={w * 0.76} height={bottom - fillTop - 3} rx={8} fill={`url(#${id})`} /> : null}
      <Path d={`M${w * 0.2} ${h * 0.32} L${w * 0.22} ${h * 0.8}`} stroke="rgba(255,255,255,0.35)" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} accessibilityLabel="Schließen">
        <Pressable style={st.sheet} onPress={() => {}}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[st.h2, { flex: 1, marginBottom: 0 }]}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Schließen" style={st.close}>
              <Icon name="close" color={C.dim} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Rückfrage – im Browser über `confirm`, auf dem Gerät über Alert (Alert gibt es im Browser nicht). */
export function ask(title: string, text: string, yes = 'Ja'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(typeof window !== 'undefined' && window.confirm(title + '\n\n' + text));
  return new Promise((res) => Alert.alert(title, text, [{ text: 'Abbrechen', style: 'cancel', onPress: () => res(false) }, { text: yes, style: 'destructive', onPress: () => res(true) }]));
}

export function tell(title: string, text: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(title + '\n\n' + text);
  } else Alert.alert(title, text);
}

export function Chip({ title, on, onPress, color = C.gold }: { title: string; on: boolean; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[st.chip, on && { backgroundColor: color, borderColor: color }]}>
      <Text style={[st.chipText, on && { color: C.bg }]}>{title}</Text>
    </Pressable>
  );
}

export function PlaceholderNote({ text = 'Bild folgt' }: { text?: string }) {
  return <Text style={st.ph}>{text}</Text>;
}

export const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40, alignItems: 'center' },
  head: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: S.pad, paddingTop: 18, paddingBottom: 6, width: '100%', maxWidth: 640 },
  body: { paddingHorizontal: S.pad, gap: 14, width: '100%', maxWidth: 640 },
  title: { fontFamily: F.title, fontSize: 26, color: C.gold, letterSpacing: 0.5 },
  sub: { fontFamily: F.text, fontSize: 16, color: C.dim, marginTop: 4 },
  card: { backgroundColor: C.card, borderRadius: S.radius, padding: S.pad, borderWidth: 1, borderColor: C.goldDim, gap: 10 },
  h2: { fontFamily: F.title, fontSize: 20, color: C.text, marginBottom: 2 },
  p: { fontFamily: F.text, fontSize: 16, lineHeight: 23, color: C.text },
  btn: { minHeight: S.tap, borderRadius: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnMain: { backgroundColor: C.gold },
  btnGhost: { borderWidth: 1.5, borderColor: C.gold },
  btnText: { fontFamily: F.bold, fontSize: 16 },
  label: { fontFamily: F.bold, fontSize: 15, color: C.dim },
  input: { minHeight: S.tap, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(0,0,0,0.2)', color: C.text, fontFamily: F.text, fontSize: 17, paddingHorizontal: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(5,8,20,0.72)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '90%', backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.goldDim },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.line, justifyContent: 'center' },
  chipText: { fontFamily: F.bold, fontSize: 15, color: C.text },
  ph: { fontFamily: F.text, fontSize: 13, color: '#F2A7A0' },
});
