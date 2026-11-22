import { router } from 'expo-router';
import { Card, H2, Icon, P, PlaceholderNote, Screen } from '../../ui/kit';
import { C } from '../../ui/theme';

export default function Refuge() {
  return (
    <Screen title="Refugium" sub="Die alte Hütte im Wald">
      <Card style={{ alignItems: 'center' }}>
        <Icon name="home-variant-outline" size={72} color={C.gold} />
        <PlaceholderNote text="Platzhalter – das Bild der Hütte folgt" />
        <P dim>Hier baut ihr später eure Hütte aus: Kamin, Teppich, Regale, ein Platz für den Wolf.</P>
      </Card>
      <Card onPress={() => router.push('/geld')} label="Die drei Gläser öffnen">
        <H2>Auf dem Kaminsims</H2>
        <P>Hier stehen deine drei Gläser: Sparen, Ausgeben, Teilen. Antippen zum Öffnen.</P>
      </Card>
    </Screen>
  );
}
