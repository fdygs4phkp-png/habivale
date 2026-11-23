// Hexenhaus der Mentorin (Phase 5): Besuch des Tages (Rat passend zur Lage, je Besuchstag eine neue Geschichte),
// Geschichtenbuch, Haus außen und innen, Erinnerungen an alles, was sie euch schon verkündet hat.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dayKey, shortDateDe } from '../logic/date.ts';
import { adviceFor, TALES, taleOfDay, talesOpen } from '../logic/mentor.ts';
import { eventFor } from '../logic/trophies.ts';
import { useStore } from '../state/store';
import { MENTOR_POSE, WITCH_IMG } from '../ui/images';
import { Card, Chip, H2, Icon, P, Screen } from '../ui/kit';
import { useMode } from '../ui/mode';
import { C, F } from '../ui/theme';

export default function WitchHouse() {
  const { state, today, visit, ready } = useStore();
  const { kid } = useMode();
  const [inside, setInside] = useState(false);
  const [openTale, setOpenTale] = useState<number | null>(null);
  // Der Besuch zählt, sobald man das Haus betritt (einmal am Tag)
  useEffect(() => {
    if (ready) visit(today);
  }, [ready, today, visit]);

  const advice = adviceFor(state, today);
  const newTale = taleOfDay(state, today);
  const open = talesOpen(state);
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

      <Card style={{ borderColor: C.gold }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <Image source={MENTOR_POSE.explain} style={{ width: 80, height: 130 }} contentFit="contain" accessibilityLabel="Die Mentorin" />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.who}>Die Mentorin · Besuch vom {shortDateDe(today)}</Text>
            <Text style={[s.title, kid && { fontSize: 20 }]}>{advice.title}</Text>
            <P>{advice.text}</P>
          </View>
        </View>
      </Card>

      {newTale !== null ? (
        <Card>
          <Text style={s.who}>Eine neue Geschichte</Text>
          <Text style={[s.title, kid && { fontSize: 20 }]}>{TALES[newTale].title}</Text>
          <P>{TALES[newTale].text}</P>
          <Text style={s.moral}>„{TALES[newTale].moral}“</Text>
        </Card>
      ) : null}

      <H2>Das Geschichtenbuch</H2>
      <P dim>
        {open < TALES.length
          ? `${open} von ${TALES.length} Geschichten. Jeden Tag, an dem du die Mentorin besuchst, erzählt sie dir eine neue.`
          : `Alle ${TALES.length} Geschichten. Die Mentorin freut sich trotzdem über jeden Besuch.`}
      </P>
      {TALES.map((t, i) => {
        const has = i < open;
        const isOpen = openTale === i;
        return (
          <Pressable
            key={t.title}
            onPress={() => has && setOpenTale(isOpen ? null : i)}
            accessibilityRole="button"
            aria-disabled={!has}
            aria-expanded={isOpen}
            accessibilityLabel={has ? t.title : `Geschichte ${i + 1}, noch nicht erzählt`}
            style={[s.tale, !has && { opacity: 0.45 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name={has ? 'book-open-variant' : 'lock-outline'} size={20} color={has ? C.gold : C.dim} />
              <Text style={[s.taleTitle, !has && { color: C.dim }]}>{has ? `${i + 1}. ${t.title}` : `${i + 1}. Noch nicht erzählt`}</Text>
              {has ? <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={C.dim} /> : null}
            </View>
            {isOpen ? (
              <View style={{ gap: 6, marginTop: 8 }}>
                <P>{t.text}</P>
                <Text style={s.moral}>„{t.moral}“</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}

      <H2>Erinnerungen</H2>
      {memories.length === 0 ? (
        <P dim>Noch ist hier nichts. Sobald du etwas erreichst, erzählt dir die Mentorin davon – und hier kannst du es nachlesen.</P>
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
        <H2>Deine eigene Geschichte</H2>
        <P dim>Mit jedem großen Schritt öffnet sich auf „Abenteuer“ ein neues Kapitel.</P>
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
  moral: { fontFamily: F.bold, fontSize: 16, lineHeight: 23, color: C.gold, fontStyle: 'italic' },
  tale: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 14 },
  taleTitle: { flex: 1, fontFamily: F.bold, fontSize: 16, color: C.text },
});
