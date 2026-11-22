import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, longDateDe } from '../../logic/date.ts';
import { activeHabits, currentStreak, dueHabits, isDone } from '../../logic/habits.ts';
import { balances, formatEuro, JARS } from '../../logic/money.ts';
import { levelInfo, totalXp, xpToday } from '../../logic/progress.ts';
import { FREE_HABIT_LIMIT } from '../../logic/types.ts';
import { useStore } from '../../state/store';
import { APP_VERSION } from '../../version';
import { Bar, Button, Card, Chip, Field, Grid, H2, Icon, P, Ring, Screen, useLayout } from '../../ui/kit';
import { C, F, JAR_COLOR, JAR_NAME } from '../../ui/theme';

function mentorLine(due: number, done: number): string {
  if (due === 0) return 'Heute ist nichts fällig. Ruh dich aus – auch das gehört zum Weg.';
  if (done === 0) return 'Ein großer Traum ist wie ein ferner Berg. Fang mit einem kleinen Schritt an.';
  if (done < due) return due - done === 1 ? 'Noch einer – dann ist dein Tag geschafft.' : 'Gut so. Schritt für Schritt.';
  return 'Alles geschafft! Euer Wolf ist stolz auf euch.';
}

export default function Today() {
  const { ready, state, today, toggle, setName } = useStore();
  const [which, setWhich] = useState<'today' | 'yesterday'>('today');
  const [nameDraft, setNameDraft] = useState('');
  const { tablet } = useLayout();
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  const day = which === 'today' ? today : addDays(today, -1);
  const due = dueHabits(state.habits, day);
  const doneN = due.filter((h) => isDone(state.done, h.id, day)).length;
  const xp = totalXp(state.habits, state.done);
  const lv = levelInfo(xp);
  const notDue = activeHabits(state.habits).filter((h) => !due.includes(h));
  const canAdd = activeHabits(state.habits).length < FREE_HABIT_LIMIT;
  const b = balances(state.money.entries);

  return (
    <Screen title={state.profileName ? 'Hallo, ' + state.profileName + '!' : 'Heute'} sub={longDateDe(today)}>
      {!state.profileName ? (
        <Card>
          <H2>Willkommen in Habivale</H2>
          <P>Wie sollen Lyra, Kael und die Mentorin dich nennen? Ein Vorname oder Spitzname reicht.</P>
          <Field label="Dein Name" value={nameDraft} onChangeText={setNameDraft} maxLength={30} returnKeyType="done" onSubmitEditing={() => nameDraft.trim() && setName(nameDraft)} />
          <Button title="Los geht’s" onPress={() => setName(nameDraft)} disabled={!nameDraft.trim()} />
        </Card>
      ) : null}

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
        <Icon name="wizard-hat" size={30} color={C.mint} />
        <Text style={s.mentorText}>{mentorLine(due.length, doneN)}</Text>
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
              <Icon name={h.icon} size={28} color={C.gold} />
              <View style={{ flex: 1 }}>
                <Text style={s.habitName}>{h.name}</Text>
                <Text style={s.habitSub}>{streak > 0 ? `${streak} ${streak === 1 ? 'Tag' : 'Tage'} in Folge` : 'Neuer Anfang'}</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => toggle(h.id, day)} accessibilityRole="checkbox" accessibilityState={{ checked: yes }} accessibilityLabel={h.name + ' erledigt'} style={[s.check, yes && s.checkOn]}>
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
        <P dim>In der kostenlosen Version gibt es {FREE_HABIT_LIMIT} aktive Gewohnheiten. Mit Premium werden es mehr (kommt später).</P>
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
              <View style={[s.dot, { backgroundColor: JAR_COLOR[j] }]} />
              <Text style={s.jarLabel}>{JAR_NAME[j]}</Text>
              <Text style={s.jarVal}>{formatEuro(b[j])}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={s.foot}>Testversion {APP_VERSION} · Deine Daten bleiben nur auf diesem Gerät.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  mentor: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'rgba(31,77,58,0.55)', borderRadius: 16, padding: 14 },
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
