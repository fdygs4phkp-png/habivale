import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Share, View } from 'react-native';
import { dayKey } from '../logic/date.ts';
import { useAccount } from '../state/account';
import { ParentGate } from '../ui/gate';
import { useStore } from '../state/store';
import { APP_VERSION } from '../version';
import { ask, Button, Card, Chip, Field, H2, Icon, P, Screen, tell } from '../ui/kit';
import { C } from '../ui/theme';

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function pickFile(): Promise<string | null> {
  return new Promise((res) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return res(null);
      f.text().then(res, () => res(null));
    };
    input.click();
  });
}

export default function Settings() {
  const store = useStore();
  const { state } = store;
  const account = useAccount();
  const [name, setName] = useState(state.profileName);

  const exportNow = async () => {
    const json = store.exportJson();
    const file = `habivale-backup-${dayKey()}.json`;
    if (Platform.OS === 'web') download(file, json);
    else await Share.share({ title: file, message: json });
  };

  const importNow = async () => {
    if (Platform.OS !== 'web') return tell('Bald', 'Auf dem iPhone und iPad kommt das Einspielen mit dem Konto (nächste Phase).');
    const text = await pickFile();
    if (!text) return;
    if (!(await ask('Backup einspielen?', 'Alles, was jetzt auf diesem Gerät ist, wird durch das Backup ersetzt.', 'Einspielen'))) return;
    const ok = store.importJson(text);
    tell(ok ? 'Fertig' : 'Das ging nicht', ok ? 'Das Backup wurde eingespielt.' : 'Diese Datei ist kein Habivale-Backup.');
  };

  return (
    <Screen
      title="Einstellungen"
      right={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityRole="button" accessibilityLabel="Schließen" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" color={C.dim} />
        </Pressable>
      }
    >
      <Card onPress={() => router.push('/konto')} label="Konto öffnen">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name={account.status === 'none' ? 'account-outline' : 'account-check-outline'} color={C.gold} size={28} />
          <View style={{ flex: 1 }}>
            <H2>Konto</H2>
            <P dim>{account.status === 'none' ? 'Kein Konto – Daten nur auf diesem Gerät' : account.email + (account.status === 'locked' ? ' (gesperrt)' : '')}</P>
          </View>
          <Icon name="chevron-right" color={C.dim} />
        </View>
      </Card>

      {!account.isChild ? (
        <Card onPress={() => router.push('/familie')} label="Familienkonto öffnen">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="home-heart" color={C.gold} size={28} />
            <View style={{ flex: 1 }}>
              <H2>Familienkonto</H2>
              <P dim>{state.family?.role === 'parent' ? `${state.family.children.length} ${state.family.children.length === 1 ? 'Kinderprofil' : 'Kinderprofile'}` : 'Kinderprofile anlegen und Geräte verbinden'}</P>
            </View>
            <Icon name="chevron-right" color={C.dim} />
          </View>
        </Card>
      ) : null}

      <Card>
        <H2>Dein Name</H2>
        <Field label="Vorname oder Spitzname" value={name} onChangeText={setName} maxLength={30} />
        <Button title="Speichern" kind="ghost" onPress={() => store.setName(name)} disabled={!name.trim() || name.trim() === state.profileName} />
      </Card>

      {account.isChild ? <ParentGate what="Premium, Backup und Löschen sind für Eltern.">{grown()}</ParentGate> : grown()}
    </Screen>
  );

  function grown() {
    return (
      <>
      <Card>
        <H2>Premium (Testversion)</H2>
        <P dim>Später gehört Premium zum Abo. In der Testversion kannst du es hier ein- und ausschalten, um beide Fassungen auszuprobieren. Deine Daten bleiben dabei immer erhalten.</P>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip title="Premium an" on={state.premium} onPress={() => store.setPremium(true)} />
          <Chip title="Kostenlos" on={!state.premium} onPress={() => store.setPremium(false)} />
        </View>
      </Card>

      {!account.isChild ? (
        <Card>
          <H2>Kinder-Modus ansehen (Testversion)</H2>
          <P dim>Für Kinderprofile von 8 bis 11 Jahren schaltet sich der Kinder-Modus von selbst ein: größere Schrift, einfache Tagebuchfragen, Vorlagen mit Bildern. Hier kannst du ihn zum Ausprobieren ansehen.</P>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip title="Kinder-Modus" on={state.kidPreview} onPress={() => store.setKidPreview(true)} />
            <Chip title="Normal" on={!state.kidPreview} onPress={() => store.setKidPreview(false)} />
          </View>
        </Card>
      ) : null}

      <Card>
        <H2>Backup</H2>
        <P dim>Speichere alles als Datei, zum Beispiel bevor du die Browser-Daten löschst. Die Datei ist nicht verschlüsselt – bewahre sie gut auf.</P>
        <Button title="Backup herunterladen" icon="download" onPress={exportNow} />
        <Button title="Backup einspielen" kind="ghost" icon="upload" onPress={importNow} />
      </Card>

      <Card>
        <H2>Testdaten</H2>
        <Button
          title="Alle Daten auf diesem Gerät löschen"
          kind="danger"
          icon="trash-can-outline"
          onPress={async () => {
            if (!(await ask('Alles löschen?', 'Gewohnheiten, Haken, Gläser, Tagebuch, Ziele und Trophäen auf diesem Gerät werden gelöscht.' + (account.status !== 'none' ? ' Du wirst dabei abgemeldet; dein Konto bleibt erhalten.' : ''), 'Alles löschen'))) return;
            if (account.status !== 'none') await account.logout();
            store.resetAll();
          }}
        />
      </Card>

      <P dim style={{ textAlign: 'center' }}>Habivale Testversion {APP_VERSION} · © 2026 eWolfe GbR</P>
      </>
    );
  }
}
