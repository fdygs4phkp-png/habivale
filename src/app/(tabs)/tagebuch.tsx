import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { addDays, longDateDe, shortDateDe } from '../../logic/date.ts';
import { dueHabits, isDone } from '../../logic/habits.ts';
import { AREA_ICON, AREA_NAME, emptyEntry, goalProgress, weekDays, weekStart, weekSummary } from '../../logic/journal.ts';
import { newId, useStore } from '../../state/store';
import { LIFE_AREAS, type Goal, type LifeArea, type Mood } from '../../logic/types.ts';
import { DIARY_COVER, DIARY_STICKERS, IMG, MOOD_IMG } from '../../ui/images';
import { ask, Bar, Button, Card, Chip, Field, Grid, H2, Icon, P, PlaceholderNote, Screen, Sheet, useLayout } from '../../ui/kit';
import { C, F } from '../../ui/theme';
import { useMode } from '../../ui/mode';

type View_ = 'day' | 'goals' | 'week';

const MOODS: { v: Mood; icon: string; label: string; color: string }[] = [
  { v: 1, icon: 'emoticon-sad-outline', label: 'traurig', color: '#8FB8F0' },
  { v: 2, icon: 'emoticon-confused-outline', label: 'nicht so gut', color: '#C9B3F0' },
  { v: 3, icon: 'emoticon-neutral-outline', label: 'okay', color: '#C2BBA8' },
  { v: 4, icon: 'emoticon-happy-outline', label: 'gut', color: '#E2BC66' },
  { v: 5, icon: 'emoticon-excited-outline', label: 'super', color: '#9FD8B5' },
];

// Schlichtes Papier wie in der Lebensrad-App (A Mystery World): warmes Creme mit doppelter Goldlinie
const PAPER = { bg: '#faeed2', outer: '#a06c22', inner: '#a8771f', ink: '#33240f', head: '#7a4f12', line: 'rgba(122,79,18,0.28)', dim: '#7d6a4c' };

export default function Journal() {
  const { state } = useStore();
  const [view, setView] = useState<View_>('day');
  const [open, setOpen] = useState(false);

  if (!state.premium) return <PremiumPreview />;
  if (!state.diary) return <DiarySetup />;
  if (!open) return <DiaryCover onOpen={() => setOpen(true)} />;

  return (
    <Screen
      title="Tagebuch"
      sub={state.diary.kind === 'free' ? 'Freie Seiten · nur für dich' : 'Nur für dich'}
      right={
        <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Tagebuch schließen" style={s.closeBtn}>
          <Icon name="book-outline" color={C.gold} size={22} />
          <Text style={s.closeText}>Schließen</Text>
        </Pressable>
      }
    >
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip title="Mein Tag" on={view === 'day'} onPress={() => setView('day')} />
        <Chip title="Ziele" on={view === 'goals'} onPress={() => setView('goals')} />
        <Chip title="Meine Woche" on={view === 'week'} onPress={() => setView('week')} />
      </View>
      {view === 'day' ? <DayPage /> : view === 'goals' ? <Goals /> : <WeekPage />}
    </Screen>
  );
}

function DiaryCover({ onOpen }: { onOpen: () => void }) {
  const { state, setDiary } = useStore();
  const { tablet, width } = useLayout();
  const d = state.diary!;
  const land = d.format === 'l';
  const w = Math.min(width - 32, land ? (tablet ? 760 : 520) : tablet ? 460 : 320);
  const h = land ? w * (752 / 1000) : w * (900 / 556);
  const year = new Date().getFullYear();
  return (
    <Screen title="Tagebuch" sub="Antippen zum Aufschlagen">
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel="Tagebuch aufschlagen" style={{ alignSelf: 'center', width: w, height: h }}>
        <Image source={DIARY_COVER[d.format]} style={{ width: w, height: h, borderRadius: 8 }} contentFit="contain" />
        <View style={[s.coverBand, land ? { top: h * 0.72, height: h * 0.16 } : { top: h * 0.74, height: h * 0.14 }]}>
          <Text style={[s.coverTitle, { fontSize: Math.max(18, w * 0.07) }]} numberOfLines={1}>{state.profileName ? `${state.profileName}s Tagebuch` : 'Mein Tagebuch'}</Text>
          <Text style={[s.coverYear, { fontSize: Math.max(13, w * 0.045) }]}>{year}</Text>
        </View>
      </Pressable>
      <PlaceholderNote text="Cover vorerst aus der Lebensrad-App geliehen" />
      <Card>
        <H2>Dein Tagebuch</H2>
        <P dim>{d.kind === 'guided' ? 'Geführt: jeden Tag ein paar Fragen.' : 'Leer: jeden Tag eine freie Seite.'} {land ? 'Querformat.' : 'Hochformat.'}</P>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Chip title="Geführt" on={d.kind === 'guided'} onPress={() => setDiary({ ...d, kind: 'guided' })} />
          <Chip title="Leer" on={d.kind === 'free'} onPress={() => setDiary({ ...d, kind: 'free' })} />
          <Chip title="Hochformat" on={!land} onPress={() => setDiary({ ...d, format: 'p' })} />
          <Chip title="Querformat" on={land} onPress={() => setDiary({ ...d, format: 'l' })} />
        </View>
        <P dim>Was du schon geschrieben hast, bleibt immer erhalten – auch wenn du die Art wechselst.</P>
      </Card>
    </Screen>
  );
}

function DiarySetup() {
  const { setDiary } = useStore();
  const { tablet } = useLayout();
  const [kind, setKind] = useState<'guided' | 'free'>('guided');
  const [format, setFormat] = useState<'p' | 'l'>('p');
  const hP = tablet ? 240 : 150;
  return (
    <Screen title="Dein Tagebuch" sub="Such dir aus, wie es sein soll">
      <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', alignItems: 'flex-end' }}>
        <Pressable onPress={() => setFormat('p')} accessibilityRole="radio" aria-checked={format === 'p'} style={[s.pickCover, format === 'p' && s.pickOn]}>
          <Image source={DIARY_COVER.p} style={{ width: hP * (556 / 900), height: hP }} contentFit="contain" />
          <Text style={s.pickText}>Hochformat</Text>
        </Pressable>
        <Pressable onPress={() => setFormat('l')} accessibilityRole="radio" aria-checked={format === 'l'} style={[s.pickCover, format === 'l' && s.pickOn]}>
          <Image source={DIARY_COVER.l} style={{ width: hP * 1.0, height: hP * 0.752 }} contentFit="contain" />
          <Text style={s.pickText}>Querformat</Text>
        </Pressable>
      </View>
      <Card>
        <H2>Welche Art Tagebuch?</H2>
        <Pressable onPress={() => setKind('guided')} accessibilityRole="radio" aria-checked={kind === 'guided'} style={[s.kind, kind === 'guided' && s.pickOn]}>
          <Icon name="help-circle-outline" color={C.gold} size={28} />
          <View style={{ flex: 1 }}>
            <Text style={s.kindTitle}>Geführt</Text>
            <P dim>Jeden Tag ein paar Fragen: Was war schön? Wofür bist du dankbar? So fällt das Schreiben leicht.</P>
          </View>
        </Pressable>
        <Pressable onPress={() => setKind('free')} accessibilityRole="radio" aria-checked={kind === 'free'} style={[s.kind, kind === 'free' && s.pickOn]}>
          <Icon name="pencil-outline" color={C.gold} size={28} />
          <View style={{ flex: 1 }}>
            <Text style={s.kindTitle}>Leer</Text>
            <P dim>Jeden Tag eine freie Seite – für alles, was du aufschreiben möchtest. Mit Stickern.</P>
          </View>
        </Pressable>
        <Button title="Tagebuch anlegen" icon="book-plus-outline" onPress={() => setDiary({ kind, format, since: Date.now() })} />
        <P dim>Du kannst die Art später jederzeit wechseln.</P>
      </Card>
    </Screen>
  );
}

/** Ein Sticker auf der Seite: verschieben mit dem Finger, antippen zum Entfernen. */
function PageSticker({ st, box, onMove, onRemove }: { st: { id: string; k: string; x: number; y: number }; box: { w: number; h: number }; onMove: (x: number, y: number) => void; onRemove: () => void }) {
  const size = Math.max(56, Math.min(96, box.w * 0.16));
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [sel, setSel] = useState(false);
  const start = useRef({ x: 0, y: 0, moved: false });
  const cur = pos ?? { x: st.x, y: st.y };
  const curRef = useRef(cur);
  curRef.current = cur;
  const at = (dx: number, dy: number) => {
    const bw = boxRef.current.w || 1;
    const bh = boxRef.current.h || 1;
    return { x: Math.min(92, Math.max(0, start.current.x + (dx / bw) * 100)), y: Math.min(94, Math.max(0, start.current.y + (dy / bh) * 100)) };
  };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        start.current = { x: curRef.current.x, y: curRef.current.y, moved: false };
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderMove: (_e, g) => {
        if (Math.abs(g.dx) + Math.abs(g.dy) > 4) start.current.moved = true;
        setPos(at(g.dx, g.dy));
      },
      onPanResponderRelease: (_e, g) => {
        if (start.current.moved || Math.abs(g.dx) + Math.abs(g.dy) > 4) {
          const p = at(g.dx, g.dy);
          onMoveRef.current(p.x, p.y);
          setPos(null);
        } else setSel((v) => !v);
      },
      onPanResponderTerminate: (_e, g) => {
        if (start.current.moved) onMoveRef.current(at(g.dx, g.dy).x, at(g.dx, g.dy).y);
        setPos(null);
      },
    }),
  ).current;
  const boxRef = useRef(box);
  boxRef.current = box;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  return (
    <View style={{ position: 'absolute', left: `${cur.x}%`, top: `${cur.y}%`, width: size, height: size, zIndex: 5 }}>
      <View {...pan.panHandlers} accessibilityRole="image" accessibilityLabel="Sticker" style={{ width: size, height: size }}>
        <Image source={DIARY_STICKERS[st.k]} style={{ width: size, height: size }} contentFit="contain" pointerEvents="none" draggable={false} />
      </View>
      {sel ? (
        <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel="Sticker entfernen" style={s.stickerDel}>
          <Icon name="close" size={16} color="#fff" />
        </Pressable>
      ) : null}
    </View>
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

function Q({ label, value, onChange, placeholder, big, dark }: { label: string; value: string; onChange: (t: string) => void; placeholder?: string; big?: boolean; dark?: boolean }) {
  const { k } = useMode();
  if (dark)
    return (
      <View style={{ gap: 6 }}>
        <Text style={[s.q, { fontSize: 16 * k }]}>{label}</Text>
        <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="rgba(194,187,168,0.55)" multiline maxLength={600} style={[s.area, { fontSize: 17 * k }]} />
      </View>
    );
  return (
    <View style={{ gap: 4 }}>
      <Text style={[s.pq, { fontSize: 16 * k }]}>{label}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="rgba(122,79,18,0.45)" multiline maxLength={big ? 4000 : 600} style={[s.parea, { fontSize: 17 * k }, big && { minHeight: 380, borderBottomWidth: 0 }]} />
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
  const { kid } = useMode();
  const { width } = useLayout();
  const free = state.diary?.kind === 'free';
  const land = state.diary?.format === 'l';
  const pageW = Math.min(width - 28, 1100);
  const [box, setBox] = useState({ w: pageW, h: 600 });
  const [pick, setPick] = useState(false);

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

      <View style={[s.paperPage, land && { minHeight: Math.max(420, pageW * 0.72) }, !land && { minHeight: Math.max(520, pageW * 1.3) }]} onLayout={(ev) => setBox({ w: ev.nativeEvent.layout.width, h: ev.nativeEvent.layout.height })}>
        <View pointerEvents="none" style={s.paperOuter} />
        <View pointerEvents="none" style={s.paperInner} />
        <Text style={s.pq}>Wie geht es dir?</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {MOODS.map((m) => (
            <Pressable key={m.v} onPress={() => set({ mood: e.mood === m.v ? null : m.v })} accessibilityRole="radio" aria-checked={e.mood === m.v} accessibilityLabel={m.label} style={{ alignItems: 'center', gap: 4 }}>
              <View style={[s.mood, { width: kid ? (tablet ? 84 : 60) : tablet ? 72 : 54, height: kid ? (tablet ? 84 : 60) : tablet ? 72 : 54, borderRadius: 42, borderColor: m.color }, e.mood === m.v && { borderColor: m.color, borderWidth: 4, backgroundColor: 'rgba(243,235,214,0.12)', transform: [{ scale: 1.08 }] }]}>
                <Image source={MOOD_IMG[m.v - 1]} style={{ width: (kid ? (tablet ? 76 : 54) : tablet ? 64 : 46), height: (kid ? (tablet ? 76 : 54) : tablet ? 64 : 46) }} contentFit="contain" accessibilityLabel={m.label} />
              </View>
              <Text style={[s.moodLabel, e.mood === m.v && { color: PAPER.ink }]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>

        {free ? null : <Text style={s.pq}>Mein Tag</Text>}
        {free ? null : <Text style={s.pt}>
          {kid
            ? due.length === 0
              ? 'Heute war nichts zu tun.'
              : doneList.length === due.length
                ? `Du hast alles geschafft – ${due.length} von ${due.length}!`
                : `Du hast ${doneList.length} von ${due.length} geschafft.`
            : due.length === 0
              ? 'An diesem Tag war keine Gewohnheit fällig.'
              : `${doneList.length === due.length ? 'Alles geschafft: ' : ''}${doneList.length} von ${due.length} Gewohnheiten erledigt${doneList.length ? ' – ' + doneList.map((h) => h.name).join(', ') : ''}.`}
        </Text>}

        {free ? (
          <Q label="Meine Seite" value={e.free} onChange={(t) => set({ free: t })} placeholder="Schreib hier, was du magst …" big />
        ) : kid ? (
          <Grid cols={tablet ? 3 : 1} gap={14}>
            <Q label="Was war heute schön?" value={e.free} onChange={(t) => set({ free: t })} />
            <Q label="Was hast du gut gemacht?" value={e.win} onChange={(t) => set({ win: t })} />
            <Q label="Wofür bist du dankbar?" value={e.thanks} onChange={(t) => set({ thanks: t })} />
          </Grid>
        ) : (
        <>
        <Grid cols={tablet ? 2 : 1} gap={14}>
          <Q label="Mein größter Erfolg" value={e.win} onChange={(t) => set({ win: t })} placeholder="Was ist dir heute gut gelungen?" />
          <Q label="Was war schwer?" value={e.hard} onChange={(t) => set({ hard: t })} />
          <Q label="Dafür bin ich dankbar" value={e.thanks} onChange={(t) => set({ thanks: t })} />
          <Q label="Was möchte ich morgen besser machen?" value={e.tomorrow} onChange={(t) => set({ tomorrow: t })} />
        </Grid>
        <Q label="Was ich noch aufschreiben möchte" value={e.free} onChange={(t) => set({ free: t })} />
        </>
        )}
        {(e.stickers || []).map((st) => (
          <PageSticker
            key={st.id}
            st={st}
            box={box}
            onMove={(x, y) => set({ stickers: (e.stickers || []).map((o) => (o.id === st.id ? { ...o, x, y } : o)) })}
            onRemove={() => set({ stickers: (e.stickers || []).filter((o) => o.id !== st.id) })}
          />
        ))}
      </View>
      <Button title="Sticker" kind="ghost" icon="sticker-emoji" onPress={() => setPick(true)} />
      <P dim style={{ textAlign: 'center' }}>Wird automatisch gespeichert. Sticker mit dem Finger verschieben, antippen zum Entfernen. Dein Tagebuch sieht niemand außer dir.</P>
      <Sheet visible={pick} onClose={() => setPick(false)} title="Sticker aussuchen">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {Object.keys(DIARY_STICKERS).map((k) => (
            <Pressable
              key={k}
              onPress={() => {
                const n = (e.stickers || []).length;
                set({ stickers: [...(e.stickers || []), { id: newId(), k, x: 70 - (n % 4) * 8, y: 6 + (n % 5) * 6 }] });
                setPick(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={'Sticker ' + k}
              style={s.stickerPick}
            >
              <Image source={DIARY_STICKERS[k]} style={{ width: 56, height: 56 }} contentFit="contain" />
            </Pressable>
          ))}
        </View>
      </Sheet>
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
              <Pressable key={st.id} onPress={() => toggleStep(g.id, st.id)} accessibilityRole="checkbox" aria-checked={st.done} style={s.step}>
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
            <Image source={MOOD_IMG[moodIcon.v - 1]} style={{ width: 36, height: 36 }} contentFit="contain" />
            <P dim>Deine Stimmung war meistens: {moodIcon.label}</P>
          </View>
        ) : null}
      </Card>

      <Card style={s.paper}>
        <Q dark label="Worauf bist du diese Woche besonders stolz?" value={proud} onChange={(t) => store.setWeekNote(monday, t)} />
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  dayNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dayTitle: { fontFamily: F.title, fontSize: 19, color: C.text, textAlign: 'center', flex: 1 },
  paper: { gap: 14 },
  paperPage: { backgroundColor: PAPER.bg, borderRadius: 4, paddingHorizontal: 34, paddingVertical: 34, gap: 14, position: 'relative', overflow: 'hidden' },
  paperOuter: { position: 'absolute', top: 12, left: 12, right: 12, bottom: 12, borderWidth: 1.6, borderColor: PAPER.outer },
  paperInner: { position: 'absolute', top: 17, left: 17, right: 17, bottom: 17, borderWidth: 1, borderColor: PAPER.inner },
  pq: { fontFamily: F.title, fontSize: 16, color: PAPER.head },
  pt: { fontFamily: F.text, fontSize: 16, lineHeight: 23, color: PAPER.ink },
  parea: { minHeight: 72, color: PAPER.ink, fontFamily: F.text, fontSize: 17, lineHeight: 28, paddingVertical: 4, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: PAPER.line, textAlignVertical: 'top', backgroundColor: 'transparent' },
  closeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 8 },
  closeText: { fontFamily: F.bold, fontSize: 15, color: C.gold },
  coverBand: { position: 'absolute', left: '14%', right: '14%', alignItems: 'center', justifyContent: 'center' },
  coverTitle: { fontFamily: F.title, color: '#f3d98a', textAlign: 'center' },
  coverYear: { fontFamily: F.title, color: '#e8c873', textAlign: 'center' },
  pickCover: { alignItems: 'center', gap: 6, padding: 8, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  pickOn: { borderColor: C.gold },
  pickText: { fontFamily: F.bold, fontSize: 14, color: C.text },
  kind: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 10, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  kindTitle: { fontFamily: F.bold, fontSize: 17, color: C.text },
  stickerDel: { position: 'absolute', top: -10, right: -10, width: 28, height: 28, borderRadius: 14, backgroundColor: '#B3412F', alignItems: 'center', justifyContent: 'center' },
  stickerPick: { width: 72, height: 72, borderRadius: 14, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(250,238,210,0.12)' },
  q: { fontFamily: F.title, fontSize: 16, color: C.gold },
  area: { minHeight: 84, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: 'rgba(0,0,0,0.2)', color: C.text, fontFamily: F.text, fontSize: 17, lineHeight: 24, padding: 12, textAlignVertical: 'top' },
  moodLabel: { fontFamily: F.bold, fontSize: 13, color: PAPER.dim },
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
