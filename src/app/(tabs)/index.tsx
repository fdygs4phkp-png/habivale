import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, longDateDe } from '../../logic/date.ts';
import { activeHabits, currentStreak, dueHabits, isDone } from '../../logic/habits.ts';
import { balances, fillLevel, formatEuro, JARS, openGoals } from '../../logic/money.ts';
import { levelInfo, totalXp, xpToday } from '../../logic/progress.ts';
import { FREE_HABIT_LIMIT, habitLimit, PREMIUM_HABIT_LIMIT } from '../../logic/types.ts';
import { Image } from 'expo-image';
import { moneyXp } from '../../logic/money.ts';
import { useStore } from '../../state/store';
import { useAccount } from '../../state/account';
import { useMode } from '../../ui/mode';
import { useUpdate } from '../../ui/update';
import { MentorEvents } from '../../ui/mentorEvent';
import { HABIT_IMG, IMG, jarPic, STICKERS } from '../../ui/images';
import { formatEuro as fmtEuro } from '../../logic/money.ts';
import { ask as askUser, tell } from '../../ui/kit';
import { APP_VERSION } from '../../version';
import { Bar, Button, Card, Chip, Field, Grid, H2, Icon, P, Ring, Screen, useLayout } from '../../ui/kit';
import { C, F, JAR_COLOR, JAR_NAME } from '../../ui/theme';

function mentorLine(due: number, done: number, kid = false): string {
  if (kid) {
    if (due === 0) return 'Heute ist frei. Ruh dich aus!';
    if (done === 0) return 'Fang mit einer Sache an. Du schaffst das!';
    if (done < due) return due - done === 1 ? 'Nur noch eins!' : 'Super! Weiter so.';
    return 'Alles geschafft! Dein Wolf freut sich.';
  }
  if (due === 0) return 'Heute ist nichts fällig. Ruh dich aus – auch das gehört zum Weg.';
  if (done === 0) return 'Ein großer Traum ist wie ein ferner Berg. Fang mit einem kleinen Schritt an.';
  if (done < due) return due - done === 1 ? 'Noch einer – dann ist dein Tag geschafft.' : 'Gut so. Schritt für Schritt.';
  return 'Alles geschafft! Dein Wolf ist stolz auf dich.';
}

export default function Today() {
  const { ready, state, today, toggle, setName, inboxDone, acceptSuggestion } = useStore();
  const [which, setWhich] = useState<'today' | 'yesterday'>('today');
  const [nameDraft, setNameDraft] = useState('');
  const { tablet } = useLayout();
  const account = useAccount();
  const { kid, k } = useMode();
  const update = useUpdate();
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  const day = which === 'today' ? today : addDays(today, -1);
  const due = dueHabits(state.habits, day);
  const doneN = due.filter((h) => isDone(state.done, h.id, day)).length;
  const xp = totalXp(state.habits, state.done) + moneyXp(state);
  const lv = levelInfo(xp);
  const notDue = activeHabits(state.habits).filter((h) => !due.includes(h));
  const canAdd = activeHabits(state.habits).length < habitLimit(state.premium);
  const b = balances(state.money.entries);

  return (
    <Screen gear
      title={state.profileName ? 'Hallo, ' + state.profileName + '!' : 'Heute'}
      sub={longDateDe(today)}
    >
      {!state.profileName ? (
        <Card>
          <H2>Willkommen in Habivale</H2>
          <P>Wie sollen Lyra, Kael und Ylva dich nennen? Ein Vorname oder Spitzname reicht.</P>
          <Field label="Dein Name" value={nameDraft} onChangeText={setNameDraft} maxLength={30} returnKeyType="done" onSubmitEditing={() => nameDraft.trim() && setName(nameDraft)} />
          <Button title="Los geht’s" onPress={() => setName(nameDraft)} disabled={!nameDraft.trim()} />
          <Button title="Meine Eltern haben mir einen Code gegeben" kind="ghost" icon="account-child-outline" onPress={() => router.push('/verbinden')} />
        </Card>
      ) : null}

      <MentorEvents />
      {update.latest ? (
        <Card style={{ borderColor: C.mint }}>
          <H2>Neue Version {update.latest}</H2>
          <P dim>Habivale hat eine neue Version. Deine Daten bleiben dabei erhalten.</P>
          <Button title="Jetzt aktualisieren" icon="update" onPress={update.reload} />
        </Card>
      ) : null}

      {state.inbox.map((it) => (
        <Card key={it.id} style={{ borderColor: C.gold, gap: 10 }}>
          {it.kind === 'praise' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {it.sticker && STICKERS[it.sticker] ? <Image source={STICKERS[it.sticker]} style={{ width: 64, height: 64 }} contentFit="contain" /> : null}
              <View style={{ flex: 1 }}>
                <Text style={s.inboxFrom}>{it.from} schickt dir ein Lob</Text>
                <Text style={s.inboxText}>„{it.text}“</Text>
              </View>
            </View>
          ) : it.kind === 'allowance' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Icon name="cash-plus" size={40} color={C.jarSave} />
              <View style={{ flex: 1 }}>
                <Text style={s.inboxFrom}>Taschengeld von {it.from}</Text>
                <Text style={s.inboxText}>{fmtEuro(it.cents || 0)} – schon auf deine drei Gläser verteilt.</Text>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Icon name={it.habit?.icon || 'lightbulb-on-outline'} size={40} color={C.gold} />
              <View style={{ flex: 1 }}>
                <Text style={s.inboxFrom}>{it.from} schlägt dir eine Gewohnheit vor</Text>
                <Text style={s.inboxText}>{it.habit?.name}</Text>
              </View>
            </View>
          )}
          {it.kind === 'suggest' ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Annehmen"
                  onPress={() => {
                    if (!acceptSuggestion(it.id)) tell('Kein Platz mehr', state.premium ? `Du hast schon ${PREMIUM_HABIT_LIMIT} aktive Gewohnheiten. Pausiere eine, dann kannst du den Vorschlag annehmen.` : `In der kostenlosen Version gibt es ${FREE_HABIT_LIMIT} aktive Gewohnheiten. Pausiere eine – oder frag deine Eltern nach Premium, dann gehen bis zu ${PREMIUM_HABIT_LIMIT}.`);
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Nein, danke" kind="ghost" onPress={async () => (await askUser('Vorschlag ablehnen?', 'Der Vorschlag verschwindet. Das ist in Ordnung – du entscheidest.', 'Ablehnen')) && inboxDone(it.id)} />
              </View>
            </View>
          ) : (
            <Button title="Danke!" kind="ghost" icon="heart-outline" onPress={() => inboxDone(it.id)} />
          )}
        </Card>
      ))}

      <Grid cols={tablet ? 2 : 1}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
        <Ring value={due.length ? doneN / due.length : 0} label={due.length ? `${doneN}/${due.length}` : '–'} />
        <View style={{ flex: 1, gap: 6 }}>
          <P style={{ fontFamily: F.bold }}>{which === 'today' ? '+' + xpToday(state.habits, state.done, today) + ' XP heute' : 'Gestern nachtragen'}</P>
          <P dim>Level {lv.level} · {xp} XP</P>
          <Bar value={(xp - lv.from) / (lv.to - lv.from)} />
        </View>
      </Card>

      <View style={[s.mentor, tablet && { minHeight: 126 }]}>
        <Image source={IMG.mentorHead} style={s.mentorImg} accessibilityLabel="Ylva" />
        <Text style={s.mentorText}>{mentorLine(due.length, doneN, kid)}</Text>
      </View>
      </Grid>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip title="Heute" on={which === 'today'} onPress={() => setWhich('today')} />
        <Chip title="Gestern" on={which === 'yesterday'} onPress={() => setWhich('yesterday')} />
      </View>

      <Grid cols={tablet ? 2 : 1}>
      {due.map((h) => {
        const yes = isDone(state.done, h.id, day);
        const streak = currentStreak(h, state.done, today);
        return (
          <View key={h.id} style={[s.habit, yes && { borderColor: C.mint }]}>
            <Pressable onPress={() => router.push({ pathname: '/habit', params: { id: h.id } })} style={s.habitMain} accessibilityRole="button" accessibilityLabel={h.name + ' bearbeiten'}>
              {HABIT_IMG[h.icon] ? <Image source={HABIT_IMG[h.icon]} style={{ width: kid ? 48 : 38, height: kid ? 48 : 38 }} contentFit="contain" /> : <Icon name={h.icon} size={28} color={C.gold} />}
              <View style={{ flex: 1 }}>
                <Text style={[s.habitName, { fontSize: 17 * k }]}>{h.name}</Text>
                <Text style={s.habitSub}>{streak > 0 ? `${streak} ${streak === 1 ? 'Tag' : 'Tage'} in Folge` : 'Neuer Anfang'}</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => toggle(h.id, day)} accessibilityRole="checkbox" aria-checked={yes} accessibilityLabel={h.name + ' erledigt'} style={[s.check, kid && { width: 64, height: 64, borderRadius: 32 }, yes && s.checkOn]}>
              {yes ? <Icon name="check-bold" size={28} color={C.bg} /> : null}
            </Pressable>
          </View>
        );
      })}
      </Grid>

      {state.habits.length === 0 ? <P dim>Noch keine Gewohnheiten. Leg deine erste an – zum Beispiel „Lesen“ oder „Zähne putzen“.</P> : null}

      {notDue.length ? <P dim>Heute frei: {notDue.map((h) => h.name).join(', ')}</P> : null}

      {canAdd ? (
        <Button title="Gewohnheit hinzufügen" icon="plus" kind="ghost" onPress={() => router.push('/habit')} />
      ) : (
        state.premium ? (
          <P dim>Du hast schon {PREMIUM_HABIT_LIMIT} aktive Gewohnheiten. Pausiere eine, um eine neue anzulegen.</P>
        ) : (
          <Card style={{ borderColor: C.gold }}>
            <H2>Mehr Gewohnheiten mit Premium</H2>
            <P dim>In der kostenlosen Version gibt es {FREE_HABIT_LIMIT} aktive Gewohnheiten. Mit Premium sind es bis zu {PREMIUM_HABIT_LIMIT}{state.family?.role === 'child' ? ' – frag deine Eltern.' : '.'}</P>
            {state.family?.role === 'child' ? null : <Button title="Premium freischalten" kind="ghost" icon="star-outline" onPress={() => router.push('/einstellungen')} />}
          </Card>
        )
      )}

      <Card onPress={() => router.push('/geld')} label="Taschengeld öffnen">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <H2>Meine drei Gläser</H2>
          <View style={{ flex: 1 }} />
          <Icon name="chevron-right" color={C.dim} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {JARS.map((j) => (
            <View key={j} style={s.jarMini}>
              <Image source={jarPic(j, fillLevel(j, state.money.entries, j === 'save' ? (openGoals(state.money.goals)[0]?.cents ?? null) : null))} style={{ width: 44, height: 52 }} contentFit="contain" />
              <Text style={s.jarLabel}>{JAR_NAME[j]}</Text>
              <Text style={s.jarVal}>{formatEuro(b[j])}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={s.foot}>Testversion {APP_VERSION} · {account.status === 'none' ? 'Deine Daten bleiben nur auf diesem Gerät.' : account.isChild ? 'Verbunden mit deiner Familie, verschlüsselt gesichert.' : 'Verschlüsselt gesichert in deinem Konto.'}</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  mentor: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'rgba(31,77,58,0.55)', borderRadius: 16, padding: 14 },
  inboxFrom: { fontFamily: F.bold, fontSize: 15, color: C.gold },
  inboxText: { fontFamily: F.text, fontSize: 17, color: C.text, marginTop: 2 },
  mentorImg: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: C.gold },
  mentorText: { flex: 1, fontFamily: F.text, fontSize: 16, lineHeight: 22, color: C.text, fontStyle: 'italic' },
  habit: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, paddingLeft: 14, paddingRight: 10, minHeight: 72 },
  habitMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  habitName: { fontFamily: F.bold, fontSize: 17, color: C.text },
  habitSub: { fontFamily: F.text, fontSize: 14, color: C.dim, marginTop: 2 },
  check: { width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, borderColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: C.mint, borderColor: C.mint },
  jarMini: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  jarLabel: { fontFamily: F.text, fontSize: 14, color: C.dim },
  jarVal: { fontFamily: F.bold, fontSize: 16, color: C.text },
  foot: { fontFamily: F.text, fontSize: 13, color: C.dim, textAlign: 'center', marginTop: 8 },
});
