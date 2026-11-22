import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AREA_NAME } from '../logic/journal.ts';
import { formatEuro, JARS } from '../logic/money.ts';
import { ageStage, type Avatar, type ChildProfile } from '../logic/types.ts';
import { errorText, useAccount, type ChildView } from '../state/account';
import { useStore } from '../state/store';
import { IMG } from '../ui/images';
import { ask, Bar, Button, Card, Chip, Field, Grid, H2, Icon, P, Screen, useLayout } from '../ui/kit';
import { C, F, JAR_COLOR, JAR_NAME } from '../ui/theme';

const STAGE_NAME = { kind: 'Kinder-Modus (8–11)', jugend: 'Jugend-Modus (12–15)', erwachsen: 'ab 16' } as const;
const YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => YEAR - 18 + i); // 18 bis 8 Jahre

function appUrl(path: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin + '/habivale/' + path;
  return 'https://fdygs4phkp-png.github.io/habivale/' + path;
}

function InviteCard({ name, code, expires }: { name: string; code: string; expires: string }) {
  return (
    <Card style={{ borderColor: C.gold, alignItems: 'center' }}>
      <H2>Code für {name}</H2>
      <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12 }}>
        <QRCode value={appUrl('verbinden?code=' + code)} size={170} />
      </View>
      <Text style={s.code} selectable>{code.slice(0, 4)} {code.slice(4)}</Text>
      <P dim style={{ textAlign: 'center' }}>
        Auf dem Tablet oder Handy von {name}: den QR-Code mit der Kamera scannen – oder Habivale öffnen, „Meine Eltern haben mir einen Code gegeben“ antippen und den Code eingeben.
        Gültig bis {new Date(expires).toLocaleString('de-DE', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr, nur einmal.
      </P>
    </Card>
  );
}

function ChildCard({ v, onInvite, onRemove }: { v: ChildView; onInvite: () => void; onRemove: () => void }) {
  const snap = v.snapshot;
  const stage = ageStage(v.profile.birthYear);
  return (
    <Card style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Image source={v.profile.avatar === 'kael' ? IMG.kaelHead : IMG.lyraHead} style={s.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{v.profile.name}</Text>
          <Text style={s.small}>{STAGE_NAME[stage]} · Jahrgang {v.profile.birthYear}</Text>
          <Text style={[s.small, { color: v.connected ? C.mint : C.gold }]}>{v.connected ? 'Gerät verbunden' : 'Noch kein Gerät verbunden'}</Text>
        </View>
      </View>

      {snap?.habits ? (
        <View style={{ gap: 6 }}>
          <Text style={s.head}>Gewohnheiten (letzte 14 Tage)</Text>
          {snap.habits.length === 0 ? <P dim>Noch keine.</P> : null}
          {snap.habits.map((h) => (
            <View key={h.name} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={h.icon} size={20} color={C.gold} />
                <Text style={[s.small, { color: C.text, flex: 1 }]}>{h.name}</Text>
                <Text style={s.small}>{h.streak > 0 ? `${h.streak} in Folge` : ''}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 3 }}>
                {h.days.map((d, i) => (
                  <View key={i} style={[s.dot, d === 1 ? { backgroundColor: C.mint } : d === 0 ? { backgroundColor: 'rgba(243,235,214,0.15)' } : { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(243,235,214,0.12)' }]} />
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {snap?.goals ? (
        <View style={{ gap: 6 }}>
          <Text style={s.head}>Ziele</Text>
          {snap.goals.length === 0 ? <P dim>Noch keine.</P> : null}
          {snap.goals.map((g) => (
            <View key={g.title} style={{ gap: 4 }}>
              <Text style={[s.small, { color: C.text }]}>{g.reached ? '✓ ' : ''}{g.title} · {AREA_NAME[g.area]}</Text>
              <Bar value={g.progress} color={C.lavender} height={8} />
            </View>
          ))}
        </View>
      ) : null}

      {snap?.money ? (
        <View style={{ gap: 6 }}>
          <Text style={s.head}>Drei Gläser</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {JARS.map((j) => (
              <View key={j} style={{ alignItems: 'center' }}>
                <Text style={[s.small, { color: JAR_COLOR[j] }]}>{JAR_NAME[j]}</Text>
                <Text style={[s.small, { color: C.text, fontFamily: F.bold }]}>{formatEuro(snap.money!.balances[j])}</Text>
              </View>
            ))}
          </View>
          {snap.money.goal ? <P dim>Sparziel: {snap.money.goal.name} ({formatEuro(snap.money.goal.cents)})</P> : null}
        </View>
      ) : null}

      {v.connected && !snap ? <P dim>{v.profile.name} teilt gerade nichts mit dir.</P> : null}
      {snap ? <P dim>Stand: {new Date(snap.at).toLocaleString('de-DE', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })} · Das Tagebuch bleibt immer privat.</P> : null}

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip title={v.connected ? 'Neues Gerät verbinden' : 'Neuer Code'} on={false} onPress={onInvite} />
        <Chip title="Profil entfernen" on={false} onPress={onRemove} />
      </View>
    </Card>
  );
}

export default function Family() {
  const a = useAccount();
  const { state } = useStore();
  const { tablet } = useLayout();
  const fam = state.family?.role === 'parent' ? state.family : null;
  const [views, setViews] = useState<ChildView[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ name: string; code: string; expires: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [year, setYear] = useState<number | null>(null);
  const [avatar, setAvatar] = useState<Avatar>('lyra');

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
  const reload = useCallback(() => run(async () => setViews(await a.loadChildren())), [a]);
  const childCount = fam?.children.length ?? 0;
  useEffect(() => {
    if (fam && a.status === 'idle') void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fam?.familyId, childCount, a.status === 'idle']);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const right = (
    <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Schließen" style={s.x}>
      <Icon name="close" color={C.dim} />
    </Pressable>
  );

  if (a.isChild) {
    return (
      <Screen title="Familie" right={right}>
        <P>Dieses Gerät gehört zu einem Kinderprofil. Die Familie verwalten deine Eltern auf ihrem Gerät.</P>
      </Screen>
    );
  }

  if (a.status === 'none' || a.status === 'locked') {
    return (
      <Screen title="Familienkonto" sub="Für Eltern" right={right}>
        <Card>
          <P>Mit dem Familienkonto legt ihr Profile für eure Kinder an. Die Kinder verbinden ihr Tablet oder Handy mit einem Code – ganz ohne eigene E-Mail-Adresse.</P>
          <P>Ihr seht nur, was euer Kind freigibt: Gewohnheiten, Ziele und – bei Jüngeren – die drei Gläser. Das Tagebuch bleibt immer privat.</P>
          <P dim>Dafür braucht ihr zuerst ein eigenes Konto.</P>
          <Button title="Zum Konto" icon="account-outline" onPress={() => router.push('/konto')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen title="Familienkonto" sub="Für Eltern" right={right}>
      {!fam ? (
        <Card>
          <H2>Familie gründen</H2>
          <P>Danach könnt ihr Kinderprofile anlegen. Die Daten eurer Kinder sind verschlüsselt – auch wir können sie nicht lesen.</P>
          <Button title={busy ? 'Einen Moment …' : 'Familie gründen'} icon="home-heart" disabled={busy} onPress={() => run(a.createFamily)} />
        </Card>
      ) : (
        <>
          {invite ? <InviteCard {...invite} /> : null}

          <Grid cols={tablet ? 2 : 1}>
            {views.map((v) => (
              <ChildCard
                key={v.profile.memberId}
                v={v}
                onInvite={() => run(async () => setInvite({ name: v.profile.name, ...(await a.newInvite(v.profile)) }))}
                onRemove={async () => {
                  if (!(await ask('Profil entfernen?', `Das Profil von ${v.profile.name} und alle Daten darin werden gelöscht. Das Gerät deines Kindes ist danach nicht mehr verbunden.`, 'Entfernen'))) return;
                  await run(async () => {
                    await a.removeChild(v.profile as ChildProfile);
                    setInvite(null);
                  });
                }}
              />
            ))}
          </Grid>
          {fam.children.length === 0 ? <P dim>Noch kein Kinderprofil.</P> : null}

          {adding ? (
            <Card>
              <H2>Kind hinzufügen</H2>
              <Field label="Vorname oder Spitzname" value={name} onChangeText={setName} maxLength={30} />
              <P dim>Geburtsjahr (wir speichern kein Geburtsdatum)</P>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {YEARS.map((y) => <Chip key={y} title={String(y)} on={year === y} onPress={() => setYear(y)} />)}
              </View>
              {year ? <P dim>{STAGE_NAME[ageStage(year)]}</P> : null}
              <P dim>Wer begleitet dein Kind?</P>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {(['lyra', 'kael'] as Avatar[]).map((av) => (
                  <Pressable key={av} onPress={() => setAvatar(av)} accessibilityRole="radio" aria-checked={avatar === av} style={[s.pick, avatar === av && { borderColor: C.gold }]}>
                    <Image source={av === 'lyra' ? IMG.lyraHead : IMG.kaelHead} style={s.avatar} />
                    <Text style={s.small}>{av === 'lyra' ? 'Lyra' : 'Kael'}</Text>
                  </Pressable>
                ))}
              </View>
              <Button
                title={busy ? 'Einen Moment …' : 'Profil anlegen und Code erstellen'}
                disabled={!name.trim() || !year || busy}
                onPress={() =>
                  run(async () => {
                    const r = await a.addChild(name, year!, avatar);
                    setInvite({ name: name.trim(), ...r });
                    setAdding(false);
                    setName('');
                    setYear(null);
                  })
                }
              />
              <Button title="Abbrechen" kind="ghost" onPress={() => setAdding(false)} />
            </Card>
          ) : (
            <Button title="Kind hinzufügen" icon="account-plus-outline" onPress={() => setAdding(true)} />
          )}
          <Button title="Aktualisieren" kind="ghost" icon="refresh" onPress={reload} disabled={busy} />
        </>
      )}
      {msg ? <P style={{ color: '#F2A7A0' }}>{msg}</P> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  x: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  code: { fontFamily: F.bold, fontSize: 30, color: C.gold, letterSpacing: 4, marginTop: 8 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: C.goldDim },
  name: { fontFamily: F.title, fontSize: 19, color: C.text },
  small: { fontFamily: F.text, fontSize: 14, color: C.dim },
  head: { fontFamily: F.bold, fontSize: 15, color: C.gold, marginTop: 4 },
  dot: { flex: 1, height: 14, borderRadius: 4, maxWidth: 22 },
  pick: { alignItems: 'center', gap: 4, padding: 8, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
});
