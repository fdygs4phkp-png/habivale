// Die Mentorin verkündet Ereignisse: neue Trophäe, neues Level, der Wolf wächst. Eines nach dem anderen.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { pendingEvents } from '../logic/trophies.ts';
import { useStore } from '../state/store';
import { CHEER, MENTOR_POSE, REFUGE_OUT, TROPHY_IMG, WOLF_HAPPY } from './images';
import { Button } from './kit';
import { useMode } from './mode';
import { C, F } from './theme';

export function MentorEvents() {
  const { state, ready, celebrate } = useStore();
  const { kid } = useMode();
  if (!ready) return null;
  const ev = pendingEvents(state)[0];
  if (!ev) return null;
  const pic = ev.trophyId ? TROPHY_IMG[ev.trophyId] : ev.wolf !== undefined ? WOLF_HAPPY[ev.wolf] : ev.refuge ? REFUGE_OUT.summer[ev.refuge - 1] : CHEER;
  const pose = ev.kind === 'trophy' ? MENTOR_POSE.gift : MENTOR_POSE.joy;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => celebrate(ev.key)}>
      <View style={s.back}>
        <View style={s.box} accessibilityRole="alert">
          <View style={s.top}>
            <Image source={pose} style={s.pose} contentFit="contain" accessibilityLabel="Die Mentorin" />
            {pic ? <Image source={pic} style={s.pic} contentFit="contain" /> : <Text style={s.big}>★</Text>}
          </View>
          <View style={s.body}>
            <Text style={s.who}>Die Mentorin</Text>
            <Text style={[s.title, kid && { fontSize: 26 }]}>{ev.title}</Text>
            <Text style={[s.text, kid && { fontSize: 19, lineHeight: 26 }]}>{ev.text}</Text>
            <Button title="Danke!" icon="heart-outline" onPress={() => celebrate(ev.key)} />
            {ev.kind === 'refuge' ? (
              <Pressable onPress={() => { celebrate(ev.key); router.push('/refugium'); }} accessibilityRole="button" style={s.link}>
                <Text style={s.linkText}>Zum Refugium</Text>
              </Pressable>
            ) : null}
            {ev.kind === 'trophy' ? (
              <Pressable onPress={() => { celebrate(ev.key); router.push('/sammlung'); }} accessibilityRole="button" style={s.link}>
                <Text style={s.linkText}>In der Sammlung ansehen</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: 'rgba(5,8,20,0.8)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  box: { width: '100%', maxWidth: 460, backgroundColor: C.card, borderRadius: 22, overflow: 'hidden', borderWidth: 1.5, borderColor: C.gold },
  top: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6, paddingTop: 16, paddingHorizontal: 12, backgroundColor: 'rgba(31,77,58,0.45)' },
  pose: { width: 120, height: 200 },
  body: { padding: 20, alignItems: 'center', gap: 10 },
  pic: { width: 170, height: 170, marginBottom: 10 },
  big: { fontSize: 64, color: C.gold, marginTop: 40 },
  who: { fontFamily: F.bold, fontSize: 14, color: C.mint },
  title: { fontFamily: F.title, fontSize: 22, color: C.gold, textAlign: 'center' },
  text: { fontFamily: F.text, fontSize: 17, lineHeight: 24, color: C.text, textAlign: 'center' },
  link: { padding: 8 },
  linkText: { fontFamily: F.bold, fontSize: 15, color: C.gold, textDecorationLine: 'underline' },
});
