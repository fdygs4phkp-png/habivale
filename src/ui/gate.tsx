// Eltern-Sperre (Parental Gate): eine Aufgabe, die jüngere Kinder nicht einfach lösen.
// Apple verlangt so etwas vor Käufen, Links nach außen und Einstellungen, die Daten betreffen.

import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Field, H2, P } from './kit';

const WORDS = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
const TENS = ['', 'zehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

export function numberWord(n: number): string {
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (n < 10) return WORDS[n];
  if (n === 11) return 'elf';
  if (n === 12) return 'zwölf';
  if (n < 20) return (o === 6 ? 'sech' : o === 7 ? 'sieb' : WORDS[o]) + 'zehn';
  if (o === 0) return TENS[t];
  return (o === 1 ? 'ein' : WORDS[o]) + 'und' + TENS[t];
}

export function ParentGate({ children, what }: { children: React.ReactNode; what: string }) {
  const n = useMemo(() => 21 + Math.floor(Math.random() * 78), []);
  const [v, setV] = useState('');
  const [open, setOpen] = useState(false);
  if (open) return <>{children}</>;
  return (
    <Card>
      <H2>Für Eltern</H2>
      <P>{what} Bitte gib die Zahl als Ziffern ein:</P>
      <P style={{ fontSize: 20 }}>„{numberWord(n)}“</P>
      <View style={{ gap: 10 }}>
        <Field label="Zahl in Ziffern" value={v} onChangeText={setV} keyboardType="number-pad" maxLength={3} />
        <Button title="Weiter" disabled={v.trim() !== String(n)} onPress={() => setOpen(true)} />
      </View>
    </Card>
  );
}
