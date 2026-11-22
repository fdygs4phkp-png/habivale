import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { errorText, useAccount } from '../state/account';
import { useStore } from '../state/store';
import { ageStage, type Shares } from '../logic/types.ts';
import { ParentGate } from '../ui/gate';
import { ask, Button, Card, Chip, Field, H2, Icon, P, Screen } from '../ui/kit';
import { C, F } from '../ui/theme';

const RULES: [string, (p: string) => boolean][] = [
  ['mindestens 10 Zeichen', (p) => p.length >= 10],
  ['ein Großbuchstabe', (p) => /[A-ZÄÖÜ]/.test(p)],
  ['ein Kleinbuchstabe', (p) => /[a-zäöüß]/.test(p)],
  ['eine Zahl', (p) => /\d/.test(p)],
  ['ein Sonderzeichen', (p) => /[^A-Za-z0-9ÄÖÜäöüß]/.test(p)],
];

function CodeCard({ code, onDone }: { code: string; onDone?: () => void }) {
  return (
    <Card style={{ borderColor: C.gold }}>
      <H2>Dein Wiederherstellungs-Code</H2>
      <Text style={s.code} selectable>{code}</Text>
      <P>Schreib diesen Code auf Papier und bewahre ihn gut auf. Wenn du dein Passwort vergisst, kommst du nur damit wieder an deine Daten. Niemand sonst – auch wir nicht – kann sie öffnen.</P>
      {onDone ? <Button title="Ich habe den Code aufgeschrieben" onPress={onDone} /> : null}
    </Card>
  );
}

export default function AccountScreen() {
  const a = useAccount();
  const store = useStore();
  const fam = store.state.family?.role === 'child' ? store.state.family : null;
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [age, setAge] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [shownCode, setShownCode] = useState<string | null>(null);
  const [rc, setRc] = useState('');

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
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

  const pwOk = RULES.every(([, f]) => f(pw));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canRegister = emailOk && pwOk && age && consent;

  return (
    <Screen
      title="Konto"
      sub="Deine Daten sicher auf allen Geräten"
      right={
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Schließen" style={s.x}>
          <Icon name="close" color={C.dim} />
        </Pressable>
      }
    >
      {!a.available ? (
        <Card>
          <P>Das Konto funktioniert in dieser Testversion im Browser. In der iPhone- und Android-App kommt es mit einer späteren Version.</P>
        </Card>
      ) : null}

      {newCode ? <CodeCard code={newCode} onDone={() => setNewCode(null)} /> : null}

      {a.status === 'none' && a.available ? (
        <>
          <Button title="Meine Eltern haben mir einen Code gegeben" kind="ghost" icon="account-child-outline" onPress={() => router.push('/verbinden')} />
        </>
      ) : null}

      {a.status === 'none' && a.available ? (
        <>
          <Card>
            <P>Mit einem Konto werden deine Gewohnheiten, Gläser, Ziele und dein Tagebuch <Text style={{ fontFamily: F.bold }}>verschlüsselt</Text> gespeichert. So sind sie sicher, auch wenn du das Gerät wechselst. Ohne Konto bleibt alles nur auf diesem Gerät.</P>
            <P dim>Ein eigenes Konto gibt es ab 16 Jahren. Für Jüngere kommt bald das Familienkonto: Eltern legen das Profil an, ganz ohne E-Mail des Kindes.</P>
          </Card>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip title="Anmelden" on={mode === 'login'} onPress={() => setMode('login')} />
            <Chip title="Konto erstellen" on={mode === 'register'} onPress={() => setMode('register')} />
          </View>
          <Field label="E-Mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Passwort" value={pw} onChangeText={setPw} secureTextEntry autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          {mode === 'register' ? (
            <>
              <View style={{ gap: 4 }}>
                {RULES.map(([t, f]) => (
                  <View key={t} style={s.rule}>
                    <Icon name={f(pw) ? 'check-circle' : 'circle-outline'} size={18} color={f(pw) ? C.mint : C.dim} />
                    <Text style={[s.ruleText, f(pw) && { color: C.text }]}>{t}</Text>
                  </View>
                ))}
              </View>
              <Check on={age} onPress={() => setAge(!age)} text="Ich bin mindestens 16 Jahre alt." />
              <Check on={consent} onPress={() => setConsent(!consent)} text="Ich bin mit der Speicherung meiner verschlüsselten Daten bei Supabase (Server in Frankfurt) einverstanden. (Datenschutzerklärung folgt – Testversion.)" />
              <Button title={busy ? 'Einen Moment …' : 'Konto erstellen'} disabled={!canRegister || busy} onPress={() => run(async () => setNewCode(await a.register(email, pw)))} />
            </>
          ) : (
            <Button title={busy ? 'Einen Moment …' : 'Anmelden'} disabled={!emailOk || !pw || busy} onPress={() => run(async () => { const c = await a.login(email, pw); if (c) setNewCode(c); })} />
          )}
        </>
      ) : null}

      {a.status === 'locked' ? (
        <Card>
          <H2>Daten entsperren</H2>
          <P>Gib deinen Wiederherstellungs-Code ein, um deine verschlüsselten Daten auf diesem Gerät zu öffnen.</P>
          <Field label="Wiederherstellungs-Code" value={rc} onChangeText={setRc} autoCapitalize="characters" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" />
          <Button title="Entsperren" disabled={rc.replace(/[^A-Za-z0-9]/g, '').length < 24 || busy} onPress={() => run(() => a.unlockWithRecovery(rc))} />
          <Button title="Abmelden" kind="ghost" onPress={() => run(a.logout)} />
        </Card>
      ) : null}

      {a.isChild && fam && a.status !== 'locked' ? (
        <>
          <Card>
            <H2>Verbunden mit deiner Familie</H2>
            <P>Hallo {fam.name}! Deine Sachen werden verschlüsselt gesichert. Deine Eltern sehen nur, was du hier freigibst.</P>
            <P dim>{ageStage(fam.birthYear) === 'kind' ? 'Kinder-Modus' : ageStage(fam.birthYear) === 'jugend' ? 'Jugend-Modus' : 'ab 16'} · {a.status === 'idle' ? 'Alles gesichert' : a.status === 'syncing' ? 'Wird gesichert …' : a.status === 'offline' ? 'Offline – wird später gesichert' : a.error || ''}</P>
          </Card>
          <Card>
            <H2>Was deine Eltern sehen</H2>
            {([
              ['habits', 'Meine Gewohnheiten und Haken'],
              ['goals', 'Meine Ziele'],
              ['money', 'Meine drei Gläser'],
            ] as [keyof Shares, string][]).map(([k, label]) => (
              <Pressable key={k} onPress={() => store.setFamily({ ...fam, shares: { ...fam.shares, [k]: !fam.shares[k] } })} accessibilityRole="switch" aria-checked={fam.shares[k]} style={s.check}>
                <Icon name={fam.shares[k] ? 'toggle-switch' : 'toggle-switch-off-outline'} color={fam.shares[k] ? C.mint : C.dim} size={40} />
                <Text style={s.checkText}>{label}</Text>
              </Pressable>
            ))}
            <View style={s.check}>
              <Icon name="lock-outline" color={C.gold} size={28} />
              <Text style={s.checkText}>Dein Tagebuch sieht niemand außer dir.</Text>
            </View>
          </Card>
          <ParentGate what="Wiederherstellungs-Code und Abmelden sind für Eltern.">
            {shownCode ? <CodeCard code={shownCode} /> : <Button title="Wiederherstellungs-Code anzeigen" kind="ghost" icon="key-outline" onPress={() => run(async () => setShownCode(await a.recoveryCode()))} />}
            <Button
              title="Dieses Gerät trennen"
              kind="danger"
              icon="link-off"
              onPress={async () => {
                if (!(await ask('Gerät trennen?', 'Das Profil bleibt erhalten. Auf diesem Gerät bleiben die Daten, werden aber nicht mehr gesichert. Zum Wiederverbinden brauchst du einen neuen Code und den Wiederherstellungs-Code.', 'Trennen'))) return;
                await run(a.logout);
              }}
            />
          </ParentGate>
        </>
      ) : null}

      {!a.isChild && a.status !== 'none' && a.status !== 'locked' ? (
        <>
          <Card>
            <H2>Angemeldet</H2>
            <P>{a.email}</P>
            <View style={s.rule}>
              <Icon name={a.status === 'idle' ? 'cloud-check-outline' : a.status === 'syncing' ? 'cloud-sync-outline' : 'cloud-alert-outline'} color={a.status === 'idle' ? C.mint : C.gold} />
              <Text style={s.ruleText}>
                {a.status === 'syncing' ? 'Wird abgeglichen …' : a.status === 'idle' ? 'Alles abgeglichen' + (a.lastSync ? ' um ' + new Date(a.lastSync).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '') : a.status === 'offline' ? 'Offline – wird später abgeglichen' : a.error || 'Fehler beim Abgleich'}
              </Text>
            </View>
            <Button title="Jetzt abgleichen" kind="ghost" icon="sync" onPress={() => run(a.syncNow)} disabled={busy} />
          </Card>
          {shownCode ? <CodeCard code={shownCode} /> : <Button title="Wiederherstellungs-Code anzeigen" kind="ghost" icon="key-outline" onPress={() => run(async () => setShownCode(await a.recoveryCode()))} />}
          <Button title="Abmelden" kind="ghost" icon="logout" onPress={() => run(a.logout)} />
          <P dim>Nach dem Abmelden bleiben deine Daten auf diesem Gerät und in deinem Konto.</P>
          <Button
            title="Konto löschen"
            kind="danger"
            icon="trash-can-outline"
            onPress={async () => {
              if (!(await ask('Konto löschen?', 'Dein Konto und alle Daten darin werden endgültig gelöscht. Auf diesem Gerät bleibt alles erhalten. Lade vorher ein Backup herunter, wenn du sichergehen willst.', 'Weiter'))) return;
              if (!(await ask('Wirklich löschen?', 'Das lässt sich nicht rückgängig machen.', 'Endgültig löschen'))) return;
              await run(a.deleteAccount);
            }}
          />
        </>
      ) : null}

      {msg ? <P style={{ color: '#F2A7A0' }}>{msg}</P> : null}
    </Screen>
  );
}

function Check({ on, onPress, text }: { on: boolean; onPress: () => void; text: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" aria-checked={on} style={s.check}>
      <Icon name={on ? 'checkbox-marked' : 'checkbox-blank-outline'} color={on ? C.gold : C.dim} size={28} />
      <Text style={s.checkText}>{text}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  x: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  code: { fontFamily: F.bold, fontSize: 17, color: C.gold, letterSpacing: 0.5, textAlign: 'center', paddingVertical: 8 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { fontFamily: F.text, fontSize: 15, color: C.dim, flex: 1 },
  check: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', minHeight: 44 },
  checkText: { flex: 1, fontFamily: F.text, fontSize: 15, lineHeight: 21, color: C.text },
});
