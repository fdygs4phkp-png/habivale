import { Image } from 'expo-image';
import { View } from 'react-native';
import { IMG } from '../../ui/images';
import { Card, H2, P, PlaceholderNote, Screen, useLayout } from '../../ui/kit';

export default function Journal() {
  const { tablet } = useLayout();
  const h = tablet ? 220 : 130;
  return (
    <Screen title="Tagebuch" sub="Kommt in der nächsten Phase">
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
        {IMG.covers.map((c, i) => (
          <Image key={i} source={c} style={{ width: h * 0.72, height: h, borderRadius: 6 }} contentFit="cover" accessibilityLabel="Tagebuch" />
        ))}
      </View>
      <PlaceholderNote text="Platzhalter – Tagebücher aus der Lebensrad-App geliehen" />
      <Card>
        <H2>Bald hier</H2>
        <P>Ein Tagebuch mit Fragen für jeden Tag, deine Ziele und Rückblicke auf Woche und Monat. Dein Tagebuch bleibt immer privat.</P>
      </Card>
    </Screen>
  );
}
