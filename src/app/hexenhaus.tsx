// Hexenhaus der Mentorin (Phase 5): Haus außen und innen, und die Erinnerungen an alles, was sie euch schon verkündet hat.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dayKey, shortDateDe } from '../logic/date.ts';
import { eventFor } from '../logic/trophies.ts';
import { useStore } from '../state/store';
import { MENTOR_POSE, WITCH_IMG } from '../ui/images';
import { Card, Chip, H2, Icon, P, Screen } from '../ui/kit';
import { C, F } from '../ui/theme';

export default function WitchHouse() {
  const { state } = useStore();
  const [inside, setInside] = useState(false);
  const memories = Object.entries(state.celebrated)
    .map(([k, at]) => eventFor(k, state.firsts[k] ?? at))
    .filter((e): e is NonNullable<typeof e> => !!e)
    .sort((a, b) => b.at - a.at)
    .slice(0, 12);

  return (
    <Screen
      title="Das Hexenhaus"
      sub="Bei der Mentorin, tief im Zauberwald"
      right={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/refugium'))} accessibilityRole="button" accessibilityLabel="Zurück" style={s.back}>
          <Icon name="close" color={C.dim} />
        </Pressable>
      }
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip title="Außen" on={!inside} onPress={() => setInside(false)} />
        <Chip title="Innen" on={inside} onPress={() => setInside(true)} />
      </View>
      <View style={s.frame}>
        <Image source={inside ? WITCH_IMG.inside : WITCH_IMG.outside} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={inside ? 'Die Stube der Mentorin' : 'Das Hexenhaus im Mondlicht'} />
      </View>

      <Card>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Image source={MENTOR_POSE.explain} style={{ width: 80, height: 130 }} contentFit="contain" accessibilityLabel="Die Mentorin" />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.who}>Die Mentorin</Text>
            <P>„Schön, dass ihr vorbeikommt. Setzt euch ans Feuer. Erzählt mir, was ihr geschafft habt – auch die kleinen Dinge zählen.“</P>
          </View>
        </View>
      </Card>

      <H2>Erinnerungen</H2>
      {memories.length === 0 ? (
        <P dim>Noch ist hier nichts. Sobald ihr etwas erreicht, erzählt euch die Mentorin davon – und hier könnt ihr es nachlesen.</P>
      ) : (
        memories.map((e) => (
          <Card key={e.key} style={{ gap: 4 }}>
            <Text style={s.date}>{shortDateDe(dayKey(new Date(e.at)))}</Text>
            <Text style={s.title}>{e.title}</Text>
            <P dim>{e.text}</P>
          </Card>
        ))
      )}
      <Card onPress={() => router.push('/abenteuer')} label="Die Geschichte lesen">
        <H2>Die Geschichte weiterlesen</H2>
        <P dim>Mit jedem großen Schritt öffnet sich ein neues Kapitel.</P>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.goldDim, backgroundColor: C.card },
  who: { fontFamily: F.bold, fontSize: 14, color: C.mint },
  date: { fontFamily: F.text, fontSize: 13, color: C.dim },
  title: { fontFamily: F.title, fontSize: 17, color: C.gold },
});
