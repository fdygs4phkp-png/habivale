import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { dayKey, WD_SHORT_DE } from '../logic/date.ts';
import { activeHabits, currentStreak, longestStreak, successRate } from '../logic/habits.ts';
import { FREE_HABIT_LIMIT, type Rhythm } from '../logic/types.ts';
import { useStore } from '../state/store';
import { ask, Button, Card, Chip, Field, H2, Icon, P, Screen } from '../ui/kit';
import { C } from '../ui/theme';

export const HABIT_ICONS = [
  'book-open-variant', 'toothbrush', 'cup-water', 'run', 'bed', 'music-note', 'pencil', 'broom',
  'food-apple', 'walk', 'heart-outline', 'star-outline', 'dog', 'flower-outline', 'bike', 'brain',
  'meditation', 'palette-outline', 'school-outline', 'hand-heart-outline', 'sprout-outline', 'weather-night',
];

const MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

export default function HabitEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, today, saveHabit, deleteHabit } = useStore();
  const old = id ? state.habits.find((h) => h.id === id) : undefined;
  const [name, setName] = useState(old?.name ?? '');
  const [icon, setIcon] = useState(old?.icon ?? HABIT_ICONS[0]);
  const [days, setDays] = useState<number[]>(old?.rhythm.kind === 'weekdays' ? old.rhythm.days : [0, 1, 2, 3, 4, 5, 6]);
  const [paused, setPaused] = useState(old?.paused ?? false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const activeOthers = activeHabits(state.habits).filter((h) => h.id !== id).length;
  const limitHit = !paused && activeOthers >= FREE_HABIT_LIMIT;
  const valid = name.trim().length > 0 && days.length > 0 && !limitHit;

  const save = () => {
    if (!valid) return;
    const rhythm: Rhythm = days.length === 7 ? { kind: 'daily' } : { kind: 'weekdays', days: [...days].sort() };
    saveHabit({ id: old?.id, name: name.trim().slice(0, 40), icon, rhythm, start: old?.start ?? dayKey(), paused, archived: false });
    close();
  };

  const remove = async () => {
    if (!old) return;
    if (await ask('Gewohnheit löschen?', `„${old.name}“ und alle Haken dazu werden gelöscht. Das lässt sich nicht rückgängig machen.`, 'Löschen')) {
      deleteHabit(old.id);
      close();
    }
  };

  const rate = old ? successRate(old, state.done, today) : null;

  return (
    <Screen
      title={old ? 'Gewohnheit bearbeiten' : 'Neue Gewohnheit'}
      right={
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Schließen" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" color={C.dim} />
        </Pressable>
      }
    >
      <Field label="Name" value={name} onChangeText={setName} placeholder="z. B. 20 Minuten lesen" maxLength={40} autoFocus={!old} />

      <H2>Symbol</H2>
      <View style={s.icons}>
        {HABIT_ICONS.map((ic) => (
          <Pressable key={ic} onPress={() => setIcon(ic)} accessibilityRole="button" aria-selected={ic === icon} style={[s.icon, ic === icon && s.iconOn]}>
            <Icon name={ic} size={26} color={ic === icon ? C.bg : C.gold} />
          </Pressable>
        ))}
      </View>

      <H2>An welchen Tagen?</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {MON_FIRST.map((d) => (
          <Chip key={d} title={WD_SHORT_DE[d]} on={days.includes(d)} onPress={() => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip title="Jeden Tag" on={days.length === 7} onPress={() => setDays([0, 1, 2, 3, 4, 5, 6])} />
        <Chip title="Mo–Fr" on={days.length === 5 && !days.includes(0) && !days.includes(6)} onPress={() => setDays([1, 2, 3, 4, 5])} />
      </View>
      {days.length === 0 ? <P dim>Wähle mindestens einen Tag.</P> : null}

      {old ? (
        <>
          <Chip title={paused ? 'Pausiert – antippen zum Fortsetzen' : 'Pausieren'} on={paused} onPress={() => setPaused(!paused)} />
          <P dim>Eine Pause bricht keine Serie. Pausierte Gewohnheiten zählen nicht zu den {FREE_HABIT_LIMIT} aktiven.</P>
          <Card>
            <H2>Dein Verlauf</H2>
            <P>Gerade in Folge: {currentStreak(old, state.done, today)} · Längste Serie: {longestStreak(old, state.done, today)}</P>
            <P>Geschafft: {rate === null ? '–' : Math.round(rate * 100) + ' %'} der fälligen Tage</P>
          </Card>
        </>
      ) : null}

      {limitHit ? <P dim>Du hast schon {FREE_HABIT_LIMIT} aktive Gewohnheiten. Pausiere eine, um eine neue anzulegen.</P> : null}

      <Button title="Speichern" onPress={save} disabled={!valid} />
      {old ? <Button title="Gewohnheit löschen" kind="danger" icon="trash-can-outline" onPress={remove} /> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  icon: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  iconOn: { backgroundColor: C.gold, borderColor: C.gold },
});
