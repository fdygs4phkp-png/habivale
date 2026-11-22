import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { levelInfo, totalXp, wolfStage, WOLF_STAGES } from '../../logic/progress.ts';
import { useStore } from '../../state/store';
import { IMG } from '../../ui/images';
import { Bar, Card, Grid, H2, P, PlaceholderNote, Screen, useLayout } from '../../ui/kit';
import { C, F } from '../../ui/theme';

export default function Adventure() {
  const { state } = useStore();
  const { tablet } = useLayout();
  const xp = totalXp(state.habits, state.done);
  const lv = levelInfo(xp);
  const w = wolfStage(state.habits, state.done);

  return (
    <Screen title="Abenteuer" sub="Lyra, Kael und euer Wolf">
      <View style={s.key}>
        <Image source={IMG.keyArt[w.index]} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Lyra, Kael, die Mentorin und euer Wolf im Zauberwald" />
      </View>
      {IMG.keyArtMissing[w.index] ? <PlaceholderNote text="Das Bild mit dem Jungwolf folgt – solange das Bild mit dem Welpen" /> : null}

      <Grid cols={tablet ? 2 : 1}>
        <Card style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Image source={IMG.wolfSit[w.index]} style={{ width: tablet ? 130 : 100, height: tablet ? 160 : 124 }} contentFit="contain" accessibilityLabel={w.stage.name} />
          <View style={{ flex: 1, gap: 6 }}>
            <H2>{w.stage.name}</H2>
            <P>Aktive Tage: {w.activeDays}</P>
            {w.next ? <P dim>Noch {w.toNext} bis zum {w.next.name}.</P> : <P dim>Euer Wolf hat die höchste Stufe erreicht.</P>}
            <Bar value={w.next ? (w.activeDays - w.stage.days) / (w.next.days - w.stage.days) : 1} color={C.lavender} height={12} />
          </View>
        </Card>
        <Card style={{ flex: 1, gap: 8 }}>
          <H2>Level {lv.level}</H2>
          <P dim>{xp} XP · nächstes Level bei {lv.to} XP</P>
          <Bar value={(xp - lv.from) / (lv.to - lv.from)} />
          <P dim>XP gibt es für jede erledigte Gewohnheit (bis zu fünf am Tag) und einen Bonus, wenn du alles geschafft hast. Ein verpasster Tag nimmt dir nichts weg.</P>
        </Card>
      </Grid>

      <H2>Die Gefährten</H2>
      <Grid cols={3} gap={10}>
        {[
          { img: IMG.lyra, name: 'Lyra', text: 'Neugierig, mutig, kreativ' },
          { img: IMG.kael, name: 'Kael', text: 'Entschlossen und treu' },
          { img: IMG.mentor, name: 'Die Mentorin', text: 'Eure weise Lehrerin' },
        ].map((c) => (
          <View key={c.name} style={s.char}>
            <Image source={c.img} style={{ width: '100%', height: tablet ? 300 : 170 }} contentFit="contain" accessibilityLabel={c.name} />
            <Text style={s.charName}>{c.name}</Text>
            <Text style={s.charText}>{c.text}</Text>
          </View>
        ))}
      </Grid>

      <Card>
        <H2>Die vier Stufen des Wolfs</H2>
        <View style={s.stages}>
          {WOLF_STAGES.map((st, i) => (
            <View key={st.key} style={[s.stage, i > w.index && { opacity: 0.35 }]}>
              <Image source={IMG.wolfSit[i]} style={{ width: '100%', height: tablet ? 120 : 70 }} contentFit="contain" />
              <Text style={s.stageName}>{st.name}</Text>
              <Text style={s.stageDays}>{st.days ? `ab ${st.days} Tagen` : 'Start'}</Text>
            </View>
          ))}
        </View>
      </Card>
      <P dim>Die Geschichte von Lyra und Kael kommt in einer späteren Version.</P>
    </Screen>
  );
}

const s = StyleSheet.create({
  key: { width: '100%', aspectRatio: 3 / 2, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.goldDim, backgroundColor: C.card },
  char: { flex: 1, alignItems: 'center', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, paddingVertical: 10, paddingHorizontal: 6, gap: 2 },
  charName: { fontFamily: F.title, fontSize: 16, color: C.gold, textAlign: 'center' },
  charText: { fontFamily: F.text, fontSize: 13, color: C.dim, textAlign: 'center' },
  stages: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  stage: { flex: 1, alignItems: 'center', gap: 2 },
  stageName: { fontFamily: F.bold, fontSize: 13, color: C.text, textAlign: 'center' },
  stageDays: { fontFamily: F.text, fontSize: 12, color: C.dim, textAlign: 'center' },
});
