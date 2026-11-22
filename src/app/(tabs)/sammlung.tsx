import { StyleSheet, Text, View } from 'react-native';
import { shortDateDe, dayKey } from '../../logic/date.ts';
import { TROPHIES } from '../../logic/trophies.ts';
import { useStore } from '../../state/store';
import { ask, Button, Icon, P, Screen } from '../../ui/kit';
import { C, F } from '../../ui/theme';

export default function Collection() {
  const { state, resetAll } = useStore();
  const got = TROPHIES.filter((t) => state.firsts['t:' + t.id] !== undefined).length;
  return (
    <Screen title="Sammlung" sub={`Trophäen: ${got} von ${TROPHIES.length}`}>
      <View style={s.grid}>
        {TROPHIES.map((t) => {
          const at = state.firsts['t:' + t.id];
          const yes = at !== undefined;
          return (
            <View key={t.id} style={[s.tile, yes && s.tileOn]}>
              <Icon name={t.icon} size={40} color={yes ? C.gold : 'rgba(194,187,168,0.35)'} />
              <Text style={[s.name, !yes && { color: C.dim }]}>{t.name}</Text>
              <Text style={s.text}>{t.text}</Text>
              {yes ? <Text style={s.date}>{shortDateDe(dayKey(new Date(at)))}</Text> : null}
            </View>
          );
        })}
      </View>
      <P dim>Die echten Trophäen-Bilder, Kleidung und Gegenstände kommen in einer späteren Version.</P>
      <Button title="Alle Testdaten löschen" kind="danger" icon="trash-can-outline" onPress={async () => (await ask('Alles löschen?', 'Alle Gewohnheiten, Haken, Gläser und Trophäen auf diesem Gerät werden gelöscht.', 'Alles löschen')) && resetAll()} />
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 14, alignItems: 'center', gap: 6 },
  tileOn: { borderColor: C.gold },
  name: { fontFamily: F.bold, fontSize: 15, color: C.text, textAlign: 'center' },
  text: { fontFamily: F.text, fontSize: 13, color: C.dim, textAlign: 'center' },
  date: { fontFamily: F.text, fontSize: 13, color: C.gold },
});
