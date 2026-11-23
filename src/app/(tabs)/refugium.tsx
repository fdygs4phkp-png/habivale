// Refugium (Phase 5): das Haus in drei Ausbaustufen und vier Jahreszeiten (plus Weihnachtszeit), innen und außen,
// im großen Haus eigene Zimmer für Lyra und Kael, die Einrichtung als Sammlung, der Kaminsims mit den drei Gläsern und der Weg zum Hexenhaus.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { REFUGE_STAGES, refugeStage, SCENE_NAME, SCENES, sceneOf, type Scene } from '../../logic/refuge.ts';
import { DECOR, ruleText, unlockedDecor } from '../../logic/world.ts';
import { TALES, talesOpen } from '../../logic/mentor.ts';
import { useStore } from '../../state/store';
import { DECOR_IMG, DECOR_REDO, REFUGE_IN, REFUGE_OUT, REFUGE_WINTER_PLAIN, ROOM_IMG } from '../../ui/images';
import { Bar, Card, Chip, Grid, H2, Icon, P, PlaceholderNote, Screen, useLayout } from '../../ui/kit';
import { C, F } from '../../ui/theme';

type Where = 'out' | 'in' | 'lyra' | 'kael';

/** Bild für außen; Winter ohne Schmuck fehlt noch → Weihnachtsbild mit Hinweis. */
function outImage(scene: Scene, n: number): { src: number; missing?: string } {
  if (scene === 'winter') {
    if (REFUGE_WINTER_PLAIN) return { src: REFUGE_WINTER_PLAIN[n - 1], missing: n === 1 ? 'Übergang: Ofenrohr auf dem Dach folgt' : undefined };
    return { src: REFUGE_OUT.xmas[n - 1], missing: 'Übergang: Winter ohne Kranz und Weihnachtsschmuck folgt' };
  }
  // Die Hütte hat innen einen Ofen mit Rohr durchs Dach; außen hat es bisher nur das Sommerbild.
  return { src: REFUGE_OUT[scene][n - 1], missing: n === 1 && scene !== 'summer' ? 'Übergang: Ofenrohr auf dem Dach folgt' : undefined };
}

export default function Refuge() {
  const { state, today } = useStore();
  const { tablet, width } = useLayout();
  const premium = state.premium;
  const r0 = refugeStage(state);
  // Ohne Premium bleibt es bei der alten Hütte (wie beim Wolf); die Tage zählen trotzdem weiter.
  const n = premium ? r0.n : 1;
  const now = sceneOf(today);
  const [scene, setScene] = useState<Scene>(now);
  const [where, setWhere] = useState<Where>('out');
  const [peek, setPeek] = useState<number | null>(null); // Vorschau einer anderen Stufe
  const shown = peek ?? n;
  const locked = shown > n;
  const decorOk = unlockedDecor(state, today);
  const cols = width >= 1000 ? 6 : tablet ? 4 : 3;
  const stage = REFUGE_STAGES[shown - 1];

  let pic: { src: number | null; missing?: string };
  if (where === 'out') pic = outImage(scene, shown);
  else if (where === 'in')
    pic = {
      src: REFUGE_IN[shown - 1],
    };
  else pic = { src: ROOM_IMG[where], missing: (where === 'lyra' ? 'Lyras' : 'Kaels') + ' Zimmer wird noch gezeichnet' };

  return (
    <Screen gear title="Refugium" sub={REFUGE_STAGES[n - 1].name}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip title="Außen" on={where === 'out'} onPress={() => setWhere('out')} />
        <Chip title="Innen" on={where === 'in'} onPress={() => setWhere('in')} />
        {shown === 3 ? <Chip title="Lyras Zimmer" on={where === 'lyra'} onPress={() => setWhere('lyra')} /> : null}
        {shown === 3 ? <Chip title="Kaels Zimmer" on={where === 'kael'} onPress={() => setWhere('kael')} /> : null}
      </View>

      <View style={s.frame}>
        {pic.src ? (
          <Image
            source={pic.src}
            style={[StyleSheet.absoluteFill, locked && { opacity: 0.45 }]}
            contentFit="cover"
            accessibilityLabel={stage.name + (where === 'out' ? ', ' + SCENE_NAME[scene] : '')}
          />
        ) : (
          <View style={s.empty}>
            <Icon name="bed-outline" size={64} color={C.goldDim} />
          </View>
        )}
        {locked ? (
          <View style={s.lockBadge}>
            <Icon name="lock-outline" size={18} color={C.text} />
            <Text style={s.lockText}>Vorschau</Text>
          </View>
        ) : null}
      </View>
      {pic.missing ? <PlaceholderNote text={pic.missing} /> : null}

      {where === 'out' ? (
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {SCENES.map((sc) => (
              <Chip key={sc} title={SCENE_NAME[sc] + (sc === now ? ' ●' : '')} on={scene === sc} onPress={() => setScene(sc)} />
            ))}
          </View>
          <P dim>● = jetzt. Das Haus zeigt immer die aktuelle Jahreszeit; vom 1. Dezember bis 6. Januar hängt ein Kranz an der Tür.</P>
        </View>
      ) : null}

      <Card>
        <H2>{stage.name}</H2>
        <P>{stage.text}</P>
        <View style={s.stages}>
          {REFUGE_STAGES.map((st) => {
            const has = st.n <= n;
            return (
              <Pressable
                key={st.n}
                onPress={() => {
                  setPeek(st.n === n ? null : st.n);
                  if (st.n !== 3 && (where === 'lyra' || where === 'kael')) setWhere('in');
                }}
                accessibilityRole="button"
                accessibilityLabel={st.name}
                aria-selected={shown === st.n}
                style={[s.stage, shown === st.n && s.stageOn]}
              >
                <Image source={outImage(now, st.n).src} style={[s.stageImg, !has && { opacity: 0.35 }]} contentFit="cover" />
                <Text style={[s.stageName, !has && { color: C.dim }]}>{st.name}</Text>
                <Text style={s.stageDays}>{st.days ? `ab ${st.days} aktiven Tagen` : 'Start'}</Text>
                {!has ? <Icon name="lock-outline" size={16} color={C.dim} /> : null}
              </Pressable>
            );
          })}
        </View>
        {!premium ? (
          <P dim>Mit Premium wächst dein Refugium mit: zum Häuschen und zum großen Haus. Deine aktiven Tage zählen schon jetzt ({r0.days}).</P>
        ) : r0.next ? (
          <View style={{ gap: 6 }}>
            <Bar value={(r0.days - r0.stage.days) / (r0.next.days - r0.stage.days)} />
            <P dim>
              Noch {r0.toNext} aktive {r0.toNext === 1 ? 'Tag' : 'Tage'} bis „{r0.next.name}“.
            </P>
          </View>
        ) : (
          <P dim>Dein Refugium ist ganz ausgebaut.</P>
        )}
      </Card>

      <Card onPress={() => router.push('/geld')} label="Die drei Gläser öffnen">
        <H2>Auf dem Kaminsims</H2>
        <P>Hier stehen deine drei Gläser: Sparen, Ausgeben, Teilen. Antippen zum Öffnen.</P>
      </Card>

      <H2>Einrichtung</H2>
      <P dim>
        {premium ? `${decorOk.size} von ${DECOR.length} Teilen. ` : ''}Jedes Teil verdienst du mit deinem Fortschritt. Bald kannst du sie selbst im Raum aufstellen.
      </P>
      <Grid cols={cols} gap={10}>
        {DECOR.map((d) => {
          const yes = premium && decorOk.has(d.id);
          return (
            <View key={d.id} style={[s.tile, yes && s.tileOn]} accessibilityLabel={d.name + (yes ? '' : ', noch verschlossen')}>
              <Image source={DECOR_IMG[d.id]} style={[s.decor, !yes && { opacity: 0.25 }]} contentFit="contain" />
              <Text style={[s.decorName, !yes && { color: C.dim }]}>{d.name}</Text>
              <Text style={s.decorText}>{yes ? d.text : ruleText(d.rule)}</Text>
              {DECOR_REDO.has(d.id) ? <PlaceholderNote text="Übergang" /> : null}
            </View>
          );
        })}
      </Grid>
      {!premium ? <P dim>Die Einrichtung gehört zu Premium.</P> : null}

      <Card onPress={() => router.push('/hexenhaus')} label="Zum Hexenhaus der Mentorin" style={{ borderColor: C.gold }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="weather-night" size={32} color={C.gold} />
          <View style={{ flex: 1 }}>
            <H2>Zum Hexenhaus</H2>
            <P dim>{state.visits[today] === undefined && talesOpen(state) < TALES.length ? 'Heute wartet eine neue Geschichte auf dich.' : 'Besuch die Mentorin tief im Wald.'}</P>
          </View>
          <Icon name="chevron-right" color={C.gold} />
        </View>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.goldDim, backgroundColor: C.card },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(5,8,20,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  lockText: { fontFamily: F.bold, fontSize: 14, color: C.text },
  stages: { flexDirection: 'row', gap: 8 },
  stage: { flex: 1, alignItems: 'center', gap: 3, padding: 6, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  stageOn: { borderColor: C.gold },
  stageImg: { width: '100%', aspectRatio: 4 / 3, borderRadius: 10 },
  stageName: { fontFamily: F.bold, fontSize: 14, color: C.text, textAlign: 'center' },
  stageDays: { fontFamily: F.text, fontSize: 12, color: C.dim, textAlign: 'center' },
  tile: { flex: 1, alignItems: 'center', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 8, gap: 3, minHeight: 170 },
  tileOn: { borderColor: C.goldDim },
  decor: { width: '100%', height: 90 },
  decorName: { fontFamily: F.bold, fontSize: 14, color: C.text, textAlign: 'center' },
  decorText: { fontFamily: F.text, fontSize: 12, color: C.dim, textAlign: 'center' },
});
