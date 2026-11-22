import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { TROPHY_IMG } from '../../ui/images';
import { shortDateDe, dayKey } from '../../logic/date.ts';
import { TROPHIES } from '../../logic/trophies.ts';
import { useStore } from '../../state/store';
import { ask, Button, Grid, Icon, P, Screen, useLayout } from '../../ui/kit';
import { C, F } from '../../ui/theme';

export default function Collection() {
  const { state, resetAll } = useStore();
  const { tablet, width } = useLayout();
  const got = TROPHIES.filter((t) => state.firsts['t:' + t.id] !== undefined).length;
  return (
    <Screen title="Sammlung" sub={`Trophäen: ${got} von ${TROPHIES.length}`}>
      <Grid cols={width >= 1000 ? 4 : tablet ? 3 : 2} gap={10}>
        {TROPHIES.map((t) => {
          const at = state.firsts['t:' + t.id];
          const yes = at !== undefined;
          return (
            <View key={t.id} style={[s.tile, yes && s.tileOn]}>
              {TROPHY_IMG[t.id] ? (
                <Image source={TROPHY_IMG[t.id]} style={[s.img, !yes && { opacity: 0.25 }]} contentFit="contain" accessibilityLabel={t.name} />
              ) : (
                <Icon name={t.icon} size={40} color={yes ? C.gold : 'rgba(194,187,168,0.35)'} />
              )}
              <Text style={[s.name, !yes && { color: C.dim }]}>{t.name}</Text>
              <Text style={s.text}>{t.text}</Text>
              {yes ? <Text style={s.date}>{shortDateDe(dayKey(new Date(at)))}</Text> : null}
            </View>
          );
        })}
      </Grid>
      <P dim>Die Trophäen-Bilder sind vorerst aus der Lebensrad-App geliehen. Eigene Habivale-Trophäen, Kleidung und Gegenstände kommen später.</P>
      <Button title="Alle Testdaten löschen" kind="danger" icon="trash-can-outline" onPress={async () => (await ask('Alles löschen?', 'Alle Gewohnheiten, Haken, Gläser und Trophäen auf diesem Gerät werden gelöscht.', 'Alles löschen')) && resetAll()} />
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flex: 1, minHeight: 170, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 14, alignItems: 'center', gap: 6 },
  tileOn: { borderColor: C.gold },
  img: { width: 96, height: 96 },
  name: { fontFamily: F.bold, fontSize: 15, color: C.text, textAlign: 'center' },
  text: { fontFamily: F.text, fontSize: 13, color: C.dim, textAlign: 'center' },
  date: { fontFamily: F.text, fontSize: 13, color: C.gold },
});
