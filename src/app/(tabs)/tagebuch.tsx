import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { addDays, longDateDe, shortDateDe } from '../../logic/date.ts';
import { dueHabits, isDone } from '../../logic/habits.ts';
import { AREA_ICON, AREA_NAME, emptyEntry, goalProgress, weekDays, weekStart, weekSummary } from '../../logic/journal.ts';
import { newId, useStore } from '../../state/store';
import { LIFE_AREAS, type Goal, type LifeArea, type Mood } from '../../logic/types.ts';
import { IMG } from '../../ui/images';
import { ask, Bar, Button, Card, Chip, Field, Grid, H2, Icon, P, PlaceholderNote, Screen, Sheet, useLayout } from '../../ui/kit';
import { C, F } from '../../ui/theme';

type View_ = 'day' | 'goals' | 'week';

const MOODS: { v: Mood; icon: string; label: string }[] = [
  { v: 1, icon: 'emoticon-sad-outline', label: 'traurig' },
  { v: 2, icon: 'emoticon-confused-outline', label: 'nicht so gut' },
  { v: 3, icon: 'emoticon-neutral-outline', label: 'okay' },
  { v: 4, icon: 'emoticon-happy-outline', label: 'gut' },
  { v: 5, icon: 'emoticon-excited-outline', label: 'super' },
];

export default function Journal() {
  const { state } = useStore();
  const [view, setView] = useState<View_>('day');

  if (!state.premium) return <PremiumPreview />;

  return (
    <Screen title="Tagebuch" sub="Nur für dich">
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip title="Mein Tag" on={view === 'day'} onPress={() => setView('day')} />
        <Chip title="Ziele" on={view === 'goals'} onPress={() => setView('goals')} />
        <Chip title="Meine Woche" on={view === 'week'} onPress={() => setView('week')} />
      </View>
      {view === 'day' ? <DayPage /> : view === 'goals' ? <Goals /> : <WeekPage />}
    </Screen>
  );
}

function PremiumPreview() {
  const { tablet } = useLayout();
  const h = tablet ? 220 : 130;
  return (
    <Screen title="Tagebuch" sub="Gehört zu Premium">
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
        {IMG.covers.map((c, i) => (
          <Image key={i} source={c} style={{ width: h * 0.72, height: h, borderRadius: 6 }} contentFit="cover" accessibilityLabel="Tagebuch" />
        ))}
      </View>
      <PlaceholderNote text="Platzhalter – Tagebücher aus der Lebensrad-App geliehen" />
      <Card>
        <H2>Dein Tagebuch</H2>
        <P>Jeden Tag ein paar Fragen, deine Ziele mit kleinen Schritten und ein Rückblick auf deine Woche. Dein Tagebuch bleibt immer privat.</P>
        <P dim>In der Testversion kannst du Premium in den Einstellungen einschalten.</P>
        <Button title="Zu den Einstellungen" kind="ghost" icon="cog-outline" onPress={() => router.push('/einstellungen')} />
      </Card>
    </Screen>
  );
}

/* ---------- Mein Tag ---------- */

function Q({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (t: string) => void; placeholder?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.q}>{label}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="rgba(194,187,168,0.55)" multiline maxLength={600} style={s.area} />
    </View>
  );
}

function DayPage() {
  const { state, today, setEntry } = useStore();
  const { tablet } = useLayout();
  const [day, setDay] = useState(today);
  const e = state.journal[day] || emptyEntry(day);
  const due = dueHabits(state.habits, day);
  const doneList = due.filter((h) => isDone(state.done, h.id, day));
  const set = (patch: Parameters<typeof setEntry>[1]) => setEntry(day, patch);

  return (
    <>
      <View style={s.dayNav}>
        <Pressable onPress={() => setDay(addDays(day, -1))} accessibilityRole="button" accessibilityLabel="Tag davor" style={s.navBtn}>
          <Icon name="chevron-left" size={30} color={C.gold} />
        </Pressable>
        <Text style={s.dayTitle}>{day === today ? 'Heute' : longDateDe(day)}</Text>
        <Pressable onPress={() => day < today && setDay(addDays(day, 1))} accessibilityRole="button" accessibilityLabel="Tag danach" style={[s.navBtn, day >= today && { opacity: 0.25 }]}>
          <Icon name="chevron-right" size={30} color={C.gold} />
        </Pressable>
      </View>

      <Card style={s.paper}>
        <Text style={s.q}>Wie geht es dir?</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {MOODS.map((m) => (
            <Pressable key={m.v} onPress={() => set({ mood: e.mood === m.v ? null : m.v })} accessibilityRole="radio" accessibilityState={{ checked: e.mood === m.v }} accessibilityLabel={m.label} style={[s.mood, e.mood === m.v && s.moodOn]}>
              <Icon name={m.icon} size={tablet ? 40 : 32} color={e.mood === m.v ? C.bg : C.gold} />
            </Pressable>
          ))}
        </View>

        <Text style={s.q}>Mein Tag</Text>
        <P>
          {due.length === 0
            ? 'An diesem Tag war keine Gewohnheit fällig.'
            : `${doneList.length === due.length ? 'Alles geschafft: ' : ''}${doneList.length} von ${due.length} Gewohnheiten erledigt${doneList.length ? ' – ' + doneList.map((h) => h.name).join(', ') : ''}.`}
        </P>

        <Grid cols={tablet ? 2 : 1} gap={14}>
          <Q label="Mein größter Erfolg" value={e.win} onChange={(t) => set({ win: t })} placeholder="Was ist dir heute gut gelungen?" />
          <Q label="Was war schwer?" value={e.hard} onChange={(t) => set({ hard: t })} />
          <Q label="Dafür bin ich dankbar" value={e.thanks} onChange={(t) => set({ thanks: t })} />
          <Q label="Was möchte ich morgen besser machen?" value={e.tomorrow} onChange={(t) => set({ tomorrow: t })} />
        </Grid>
        <Q label="Was ich noch aufschreiben möchte" value={e.free} onChange={(t) => set({ free: t })} />
      </Card>
      <P dim style={{ textAlign: 'center' }}>Wird automatisch gespeichert. Dein Tagebuch sieht niemand außer dir.</P>
    </>
  );
}

/* ---------- Ziele ---------- */

type Draft = { id?: string; title: string; area: LifeArea; why: string; steps: Goal['steps'] };

function Goals() {
  const { state, saveGoal, toggleStep, setGoalReached, deleteGoal } = useStore();
  const { tablet } = useLayout();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [stepText, setStepText] = useState('');
  const active = state.goals.filter((g) => !g.reachedAt);
  const reached = state.goals.filter((g) => g.reachedAt);

  const addStep = () => {
    if (!draft || !stepText.trim()) return;
    setDraft({ ...draft, steps: [...draft.steps, { id: newId(), text: stepText.trim().slice(0, 80), done: false }] });
    setStepText('');
  };
  const save = () => {
    if (!draft || !draft.title.trim()) return;
    saveGoal({ id: draft.id, title: draft.title.trim().slice(0, 60), area: draft.area, why: draft.why.trim(), steps: draft.steps, due: null });
    setDraft(null);
  };

  return (
    <>
      <P dim>Ein großes Ziel ist wie ein ferner Berg. Teile es in kleine Schritte, die du wirklich schaffen kannst.</P>
      <Button title="Neues Ziel" icon="flag-plus-outline" onPress={() => { setStepText(''); setDraft({ title: '', area: 'school', why: '', steps: [] }); }} />

      <Grid cols={tablet ? 2 : 1}>
        {active.map((g) => (
          <Card key={g.id} style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name={AREA_ICON[g.area]} color={C.gold} size={26} />
              <View style={{ flex: 1 }}>
                <Text style={s.goalTitle}>{g.title}</Text>
                <Text style={s.goalArea}>{AREA_NAME[g.area]}</Text>
              </View>
              <Pressable onPress={() => { setStepText(''); setDraft({ id: g.id, title: g.title, area: g.area, why: g.why, steps: g.steps }); }} accessibilityRole="button" accessibilityLabel={g.title + ' bearbeiten'} style={s.navBtn}>
                <Icon name="pencil-outline" color={C.dim} />
              </Pressable>
            </View>
            {g.why ? <P dim>Warum: {g.why}</P> : null}
            <Bar value={goalProgress(g)} color={C.lavender} />
            {g.steps.map((st) => (
              <Pressable key={st.id} onPress={() => toggleStep(g.id, st.id)} accessibilityRole="checkbox" accessibilityState={{ checked: st.done }} style={s.step}>
                <View style={[s.box, st.done && s.boxOn]}>{st.done ? <Icon name="check-bold" size={18} color={C.bg} /> : null}</View>
                <Text style={[s.stepText, st.done && { color: C.dim, textDecorationLine: 'line-through' }]}>{st.text}</Text>
              </Pressable>
            ))}
            <Button title="Ziel erreicht!" kind="ghost" icon="flag-checkered" onPress={() => setGoalReached(g.id, true)} />
          </Card>
        ))}
      </Grid>
      {active.length === 0 ? <P dim>Noch kein Ziel. Was möchtest du in den nächsten Wochen schaffen?</P> : null}

      {reached.length ? (
        <>
          <H2>Erreicht</H2>
          {reached.map((g) => (
            <View key={g.id} style={s.reached}>
              <Icon name="flag-checkered" color={C.mint} />
              <Text style={[s.stepText, { flex: 1 }]}>{g.title}</Text>
              <Text style={s.goalArea}>{shortDateDe(dayFromTs(g.reachedAt!))}</Text>
              <Pressable onPress={() => setGoalReached(g.id, false)} accessibilityRole="button" accessibilityLabel="Wieder aktiv" style={s.navBtn}>
                <Icon name="undo" color={C.dim} size={20} />
              </Pressable>
            </View>
          ))}
        </>
      ) : null}

      <Sheet visible={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Ziel bearbeiten' : 'Neues Ziel'}>
        {draft ? (
          <>
            <Field label="Mein Ziel" value={draft.title} onChangeText={(t) => setDraft({ ...draft, title: t })} placeholder="z. B. Jeden Tag 20 Minuten lesen" maxLength={60} />
            <P dim>Bereich</P>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LIFE_AREAS.map((a) => <Chip key={a} title={AREA_NAME[a]} on={draft.area === a} onPress={() => setDraft({ ...draft, area: a })} />)}
            </View>
            <Field label="Warum ist mir das wichtig?" value={draft.why} onChangeText={(t) => setDraft({ ...draft, why: t })} maxLength={200} />
            <P dim>Kleine Schritte</P>
            {draft.steps.map((st) => (
              <View key={st.id} style={s.reached}>
                <Text style={[s.stepText, { flex: 1 }]}>{st.text}</Text>
                <Pressable onPress={() => setDraft({ ...draft, steps: draft.steps.filter((x) => x.id !== st.id) })} accessibilityRole="button" accessibilityLabel="Schritt entfernen" style={s.navBtn}>
                  <Icon name="close" color={C.dim} size={20} />
                </Pressable>
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}>
                <Field label="Neuer Schritt" value={stepText} onChangeText={setStepText} onSubmitEditing={addStep} returnKeyType="done" maxLength={80} placeholder="z. B. Ein Buch aussuchen" />
              </View>
              <Pressable onPress={addStep} accessibilityRole="button" accessibilityLabel="Schritt hinzufügen" style={s.plus}>
                <Icon name="plus" color={C.bg} />
              </Pressable>
            </View>
            <Button title="Speichern" onPress={save} disabled={!draft.title.trim()} />
            {draft.id ? (
              <Button
                title="Ziel löschen"
                kind="danger"
                icon="trash-can-outline"
                onPress={async () => {
                  if (await ask('Ziel löschen?', 'Das Ziel und seine Schritte werden gelöscht.', 'Löschen')) {
                    deleteGoal(draft.id!);
                    setDraft(null);
                  }
                }}
              />
            ) : null}
          </>
        ) : null}
      </Sheet>
    </>
  );
}

function dayFromTs(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => (n < 10 ? '0' + n : String(n));
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

/* ---------- Meine Woche ---------- */

function WeekPage() {
  const store = useStore();
  const { state, today } = store;
  const [monday, setMonday] = useState(weekStart(today));
  const w = weekSummary(state, monday, today);
  const days = weekDays(monday);
  const proud = state.weeks[monday]?.proud ?? '';
  const isNow = monday === weekStart(today);
  const moodIcon = w.moodAvg === null ? null : MOODS[Math.min(4, Math.max(0, Math.round(w.moodAvg) - 1))];

  return (
    <>
      <View style={s.dayNav}>
        <Pressable onPress={() => setMonday(addDays(monday, -7))} accessibilityRole="button" accessibilityLabel="Woche davor" style={s.navBtn}>
          <Icon name="chevron-left" size={30} color={C.gold} />
        </Pressable>
        <Text style={s.dayTitle}>{isNow ? 'Diese Woche' : `${shortDateDe(monday)} – ${shortDateDe(addDays(monday, 6))}`}</Text>
        <Pressable onPress={() => !isNow && setMonday(addDays(monday, 7))} accessibilityRole="button" accessibilityLabel="Woche danach" style={[s.navBtn, isNow && { opacity: 0.25 }]}>
          <Icon name="chevron-right" size={30} color={C.gold} />
        </Pressable>
      </View>

      <Card>
        <View style={s.bars}>
          {days.map((d, i) => {
            const sm = w.days.find((x) => x.day === d);
            const v = sm && sm.due ? sm.done / sm.due : 0;
            return (
              <View key={d} style={s.barCol}>
                <View style={s.barBg}>
                  <View style={[s.barFill, { height: `${v * 100}%`, backgroundColor: v === 1 ? C.mint : C.gold }]} />
                </View>
                <Text style={s.barLabel}>{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][i]}</Text>
              </View>
            );
          })}
        </View>
        <P>
          {w.done} von {w.due} Gewohnheiten erledigt · aktiv an {w.activeDays} {w.activeDays === 1 ? 'Tag' : 'Tagen'}
        </P>
        <P dim>
          Tagebuch an {w.journalDays} {w.journalDays === 1 ? 'Tag' : 'Tagen'}
          {w.goalsReached ? ` · ${w.goalsReached} ${w.goalsReached === 1 ? 'Ziel' : 'Ziele'} erreicht` : ''}
        </P>
        {moodIcon ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name={moodIcon.icon} color={C.gold} size={28} />
            <P dim>Deine Stimmung war meistens: {moodIcon.label}</P>
          </View>
        ) : null}
      </Card>

      <Card style={s.paper}>
        <Q label="Worauf bist du diese Woche besonders stolz?" value={proud} onChange={(t) => store.setWeekNote(monday, t)} />
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  dayNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dayTitle: { fontFamily: F.title, fontSize: 19, color: C.text, textAlign: 'center', flex: 1 },
  paper: { gap: 14 },
  q: { fontFamily: F.title, fontSize: 16, color: C.gold },
  area: { minHeight: 84, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(0,0,0,0.2)', color: C.text, fontFamily: F.text, fontSize: 17, lineHeight: 24, padding: 12, textAlignVertical: 'top' },
  mood: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  moodOn: { backgroundColor: C.gold, borderColor: C.gold },
  goalTitle: { fontFamily: F.bold, fontSize: 17, color: C.text },
  goalArea: { fontFamily: F.text, fontSize: 14, color: C.dim },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: C.lavender, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: C.mint, borderColor: C.mint },
  stepText: { fontFamily: F.text, fontSize: 16, color: C.text },
  reached: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 4 },
  plus: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  bars: { flexDirection: 'row', gap: 8, height: 120, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
  barBg: { flex: 1, width: '70%', maxWidth: 34, borderRadius: 8, backgroundColor: 'rgba(243,235,214,0.1)', justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontFamily: F.bold, fontSize: 13, color: C.dim },
});
