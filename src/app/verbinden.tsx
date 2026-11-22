import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { errorText, useAccount } from '../state/account';
import { Button, Card, Field, H2, Icon, P, Screen } from '../ui/kit';
import { C, F } from '../ui/theme';

export default function Connect() {
  const params = useLocalSearchParams<{ code?: string }>();
  const a = useAccount();
  const [code, setCode] = useState((params.code || '').toUpperCase());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [rc, setRc] = useState('');

  const run = async (f: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try {
      await f();
    } catch (e) {
      setMsg(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const home = () => router.replace('/');

  return (
    <Screen
      title="Mit deiner Familie verbinden"
      right={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : home())} accessibilityRole="button" accessibilityLabel="Schließen" style={s.x}>
          <Icon name="close" color={C.dim} />
        </Pressable>
      }
    >
      {recovery ? (
        <Card style={{ borderColor: C.gold }}>
          <H2>Geschafft!</H2>
          <P>Dein Gerät ist jetzt mit deiner Familie verbunden.</P>
          <P style={{ fontFamily: F.bold }}>Zeig das bitte deinen Eltern:</P>
          <Text style={s.code} selectable>{recovery}</Text>
          <P dim>Das ist der Wiederherstellungs-Code für dein Profil. Deine Eltern schreiben ihn auf und heben ihn gut auf – damit kommst du auf einem neuen Gerät wieder an deine Sachen.</P>
          <Button title="Fertig" onPress={home} />
        </Card>
      ) : needsRecovery || a.status === 'locked' ? (
        <Card>
          <H2>Deine Sachen zurückholen</H2>
          <P>Dein Profil war schon auf einem anderen Gerät. Mit dem Wiederherstellungs-Code, den deine Eltern aufgeschrieben haben, holst du alles zurück.</P>
          <Field label="Wiederherstellungs-Code" value={rc} onChangeText={setRc} autoCapitalize="characters" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" />
          <Button title="Zurückholen" disabled={busy || rc.replace(/[^A-Za-z0-9]/g, '').length < 24} onPress={() => run(async () => { await a.unlockWithRecovery(rc); home(); })} />
        </Card>
      ) : a.status !== 'none' ? (
        <Card>
          <P>Auf diesem Gerät ist schon ein Konto angemeldet{a.email ? ` (${a.email})` : ''}. Um ein Kindergerät zu verbinden, melde es zuerst ab (Einstellungen → Konto).</P>
        </Card>
      ) : (
        <Card>
          <P>Deine Eltern haben dir einen Code mit 8 Zeichen gegeben. Tipp ihn hier ein.</P>
          <Field label="Code" value={code} onChangeText={(t) => setCode(t.toUpperCase())} autoCapitalize="characters" maxLength={9} placeholder="ABCD EFGH" style={{ fontSize: 24, letterSpacing: 4, textAlign: 'center' }} />
          <Button
            title={busy ? 'Einen Moment …' : 'Verbinden'}
            disabled={busy || code.replace(/[^A-Za-z0-9]/g, '').length !== 8}
            onPress={() =>
              run(async () => {
                const r = await a.joinFamily(code);
                if (r.needsRecovery) setNeedsRecovery(true);
                else setRecovery(r.recovery);
              })
            }
          />
        </Card>
      )}
      {msg ? <P style={{ color: '#F2A7A0' }}>{msg}</P> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  x: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  code: { fontFamily: F.bold, fontSize: 17, color: C.gold, letterSpacing: 0.5, textAlign: 'center', paddingVertical: 8 },
});
