import { View } from 'react-native';
import { levelInfo, totalXp, wolfStage, WOLF_STAGES } from '../../logic/progress.ts';
import { useStore } from '../../state/store';
import { Bar, Card, H2, Icon, P, PlaceholderNote, Screen } from '../../ui/kit';
import { C } from '../../ui/theme';

export default function Adventure() {
  const { state } = useStore();
  const xp = totalXp(state.habits, state.done);
  const lv = levelInfo(xp);
  const w = wolfStage(state.habits, state.done);
  return (
    <Screen title="Abenteuer" sub="Lyra, Kael und euer Wolf">
      <Card style={{ alignItems: 'center' }}>
        <Icon name="paw" size={72} color={C.gold} />
        <H2>{w.stage.name}</H2>
        <PlaceholderNote text="Platzhalter – Bilder von Lyra, Kael und dem Wolf folgen" />
        <P>Aktive Tage: {w.activeDays}</P>
        {w.next ? <P dim>Noch {w.toNext} aktive Tage bis zum {w.next.name}.</P> : <P dim>Euer Wolf hat die höchste Stufe erreicht.</P>}
        <View style={{ width: '100%' }}>
          <Bar value={w.next ? (w.activeDays - w.stage.days) / (w.next.days - w.stage.days) : 1} color={C.lavender} height={12} />
        </View>
      </Card>
      <Card>
        <H2>Level {lv.level}</H2>
        <P dim>{xp} XP · nächstes Level bei {lv.to} XP</P>
        <Bar value={(xp - lv.from) / (lv.to - lv.from)} />
        <P dim>XP gibt es für jede erledigte Gewohnheit (bis zu fünf am Tag) und einen Bonus, wenn du alles geschafft hast. Ein verpasster Tag nimmt dir nichts weg.</P>
      </Card>
      <Card>
        <H2>Die vier Stufen des Wolfs</H2>
        {WOLF_STAGES.map((s, i) => (
          <P key={s.key} dim={i > w.index}>{i <= w.index ? '✓ ' : '· '}{s.name}{s.days ? ` – ab ${s.days} aktiven Tagen` : ''}</P>
        ))}
      </Card>
      <P dim>Die Geschichte von Lyra und Kael kommt in einer späteren Version.</P>
    </Screen>
  );
}
