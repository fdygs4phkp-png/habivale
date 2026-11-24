import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { shortDateDe } from '../logic/date.ts';
import { lessonsFor, lessonsOpen, type Lesson } from '../logic/lessons.ts';
import { dayKey } from '../logic/date.ts';
import { allocate, balances, fillLevel, formatEuro, isValidSplit, JARS, monthSummary, openGoals, parseEuro, splitCents, wishDaysLeft, wishDue } from '../logic/money.ts';
import { FREE_SAVINGS_GOALS, MAX_SAVINGS_GOALS, type Jar, type MoneyEntry, type SavingsGoal } from '../logic/types.ts';
import { useMode } from '../ui/mode';
import { Image } from 'expo-image';
import { GOAL_IMG } from '../ui/images';
import { useStore } from '../state/store';
import { ask, Bar, Button, Card, Chip, Field, Grid, H2, Icon, P, PlaceholderNote, Screen, Sheet, tell, useLayout } from '../ui/kit';
import { C, F, JAR_COLOR, JAR_NAME } from '../ui/theme';
import { jarPic } from '../ui/images';

type Mode = null | 'allowance' | 'spend' | 'share' | 'move' | 'goal' | 'split';

export default function Money() {
  const store = useStore();
  const { tablet } = useLayout();
  const { state } = store;
  const m = state.money;
  const b = balances(m.entries);
  const [mode, setMode] = useState<Mode>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [need, setNeed] = useState<'want' | 'need' | null>(null);
  const [from, setFrom] = useState<Jar>('save');
  const [to, setTo] = useState<Jar>('spend');
  const [goalName, setGoalName] = useState('');
  const [goalId, setGoalId] = useState<string | null>(null);
  const [goalIcon, setGoalIcon] = useState(GOAL_ICONS[0]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [month, setMonth] = useState(store.today.slice(0, 7));
  const { stage } = useMode();
  const lo = lessonsOpen(lessonsFor(stage), state.lessons, dayKey(), (ts) => dayKey(new Date(ts)));
  const [split, setSplitDraft] = useState(m.split);

  const open = (md: Mode) => {
    setAmount('');
    setNote('');
    setNeed(null);
    setGoalName('');
    setGoalId(null);
    setGoalIcon(GOAL_ICONS[0]);
    setSplitDraft(m.split);
    setMode(md);
  };
  const cents = parseEuro(amount);
  const close = () => setMode(null);

  const submit = () => {
    if (mode === 'split') {
      if (!isValidSplit(split)) return;
      store.setSplit(split);
      return close();
    }
    if (!cents) return;
    let okay = true;
    if (mode === 'allowance') store.addAllowance(cents, note.trim());
    else if (mode === 'spend') okay = store.addSpend(cents, note.trim(), need);
    else if (mode === 'share') okay = store.addShare(cents, note.trim());
    else if (mode === 'move') okay = note.trim().length > 0 && store.move(cents, from, to, note.trim());
    else if (mode === 'goal') store.saveSavingsGoal({ id: goalId ?? undefined, name: goalName.trim() || 'Mein Sparziel', icon: goalIcon, cents });
    if (!okay) {
      const jar: Jar = mode === 'spend' ? 'spend' : mode === 'share' ? 'share' : from;
      if (mode === 'move' && !note.trim()) return tell('Kurze Begründung', 'Schreib kurz auf, warum du umbuchst.');
      return tell('Nicht genug im Glas', `Im Glas „${JAR_NAME[jar]}“ sind ${formatEuro(b[jar])}.`);
    }
    close();
  };

  const preview = mode === 'allowance' && cents ? splitCents(cents, m.split) : null;
  const open_ = openGoals(m.goals);
  const alloc = allocate(b.save, m.goals);
  const goal = open_[0] ?? null;
  const premium = state.premium;
  const canAddGoal = open_.length < (premium ? MAX_SAVINGS_GOALS : FREE_SAVINGS_GOALS);
  const dueWishes = m.wishes.filter((w) => wishDue(w, store.today));
  const waiting = m.wishes.filter((w) => !w.answer && !wishDue(w, store.today));
  const ms = monthSummary(m.entries, month);
  const editGoal = (g: SavingsGoal) => {
    open('goal');
    setGoalId(g.id);
    setGoalName(g.name);
    setGoalIcon(g.icon);
    setAmount((g.cents / 100).toString().replace('.', ','));
  };
  const shiftMonth = (d: number) => {
    const [y, mo] = month.split('-').map(Number);
    const dt = new Date(y, mo - 1 + d, 15);
    setMonth(dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'));
  };
  const monthName = (() => {
    const [y, mo] = month.split('-').map(Number);
    return new Date(y, mo - 1, 15).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  })();

  return (
    <Screen
      title="Meine drei Gläser"
      sub="Sparen · Ausgeben · Teilen"
      right={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityRole="button" accessibilityLabel="Zurück" style={s.back}>
          <Icon name="close" color={C.dim} />
        </Pressable>
      }
    >
      <Card>
        <View style={s.jars}>
          {JARS.map((j) => (
            <View key={j} style={s.jar}>
              <Image source={jarPic(j, fillLevel(j, m.entries, goal?.cents ?? null))} style={{ width: tablet ? 140 : 84, height: (tablet ? 140 : 84) * 1.2 }} contentFit="contain" accessibilityLabel={JAR_NAME[j]} />
              <Text style={[s.jarName, { color: JAR_COLOR[j] }]}>{JAR_NAME[j]}</Text>
              <Text style={s.jarVal}>{formatEuro(b[j])}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Button title="Taschengeld eintragen" icon="plus" onPress={() => open('allowance')} />
      <Grid cols={tablet ? 3 : 2} gap={10}>
        <Button title="Ausgeben" kind="ghost" onPress={() => open('spend')} />
        <Button title="Teilen" kind="ghost" onPress={() => open('share')} />
        {tablet ? <Button title="Umbuchen" kind="ghost" icon="swap-horizontal" onPress={() => open('move')} /> : null}
      </Grid>
      {!tablet ? <Button title="Umbuchen" kind="ghost" icon="swap-horizontal" onPress={() => open('move')} /> : null}

      {dueWishes.map((w) => (
        <Card key={w.id} style={{ borderColor: C.gold }}>
          <H2>Eine Woche ist um</H2>
          <P>Ist dir „{w.name}“ ({formatEuro(w.cents)}) noch wichtig?</P>
          <Button title="Ja – ich kaufe es" onPress={() => { store.answerWish(w.id, 'buy'); open('spend'); setAmount((w.cents / 100).toString().replace('.', ',')); setNote(w.name); setNeed('want'); }} />
          <Button title="Ja – ich spare darauf" kind="ghost" disabled={!canAddGoal} onPress={() => { store.answerWish(w.id, 'goal'); store.saveSavingsGoal({ name: w.name, icon: 'gift-outline', cents: w.cents }); }} />
          <Button title="Nicht mehr so wichtig" kind="ghost" onPress={() => store.answerWish(w.id, 'no')} />
          <P dim>Gut gemacht, dass du gewartet hast!</P>
        </Card>
      ))}

      <H2>Meine Sparziele</H2>
      {open_.length === 0 ? <P dim>Wofür sparst du? Leg ein Ziel fest – zum Beispiel ein Buch oder ein Fahrrad.</P> : null}
      <Grid cols={tablet ? 2 : 1}>
        {open_.map((g, i) => {
          const saved = alloc[g.id] ?? 0;
          const done = saved >= g.cents;
          return (
            <Card key={g.id} onPress={() => editGoal(g)} label={g.name + ' bearbeiten'} style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {GOAL_IMG[g.icon] ? <Image source={GOAL_IMG[g.icon]} style={{ width: 54, height: 54 }} contentFit="contain" /> : <Icon name={g.icon} size={34} color={C.jarSave} />}
                <View style={{ flex: 1 }}>
                  <Text style={s.goalName}>{g.name}</Text>
                  <Text style={s.entryDate}>{i === 0 ? 'Wird gerade gefüllt' : `Ziel ${i + 1} – kommt nach dem ersten dran`}</Text>
                </View>
              </View>
              <P>{formatEuro(saved)} von {formatEuro(g.cents)}</P>
              <Bar value={saved / g.cents} color={C.jarSave} height={14} />
              {done ? (
                <>
                  <P style={{ color: C.mint, fontFamily: F.bold }}>Geschafft! Dein Sparglas hat genug für {g.name}.</P>
                  <Button title="Ich habe es mir gekauft" icon="gift-open-outline" onPress={async () => (await ask('Gekauft?', `${formatEuro(g.cents)} gehen aus dem Sparglas. Das Sparziel kommt in deine erreichten Ziele.`, 'Ja')) && store.buySavingsGoal(g.id)} />
                </>
              ) : (
                <P dim>Noch {formatEuro(g.cents - saved)}</P>
              )}
            </Card>
          );
        })}
      </Grid>
      {canAddGoal ? (
        <Button title="Sparziel hinzufügen" kind="ghost" icon="plus" onPress={() => open('goal')} />
      ) : !premium ? (
        <P dim>In der kostenlosen Version gibt es ein Sparziel. Mit Premium bis zu {MAX_SAVINGS_GOALS}.</P>
      ) : null}
      {m.goals.some((g) => g.boughtAt) ? <P dim>Erreicht: {m.goals.filter((g) => g.boughtAt).map((g) => g.name).join(', ')}</P> : null}

      {premium ? (
        <>
          {waiting.length ? (
            <Card>
              <H2>Meine Wunschliste</H2>
              {waiting.map((w) => (
                <View key={w.id} style={s.entry}>
                  <Icon name="timer-sand" color={C.lavender} />
                  <Text style={[s.entryText, { flex: 1 }]}>{w.name} · {formatEuro(w.cents)}</Text>
                  <Text style={s.entryDate}>noch {wishDaysLeft(w, store.today)} {wishDaysLeft(w, store.today) === 1 ? 'Tag' : 'Tage'}</Text>
                </View>
              ))}
              <P dim>Nach einer Woche fragt dich Habivale, ob dir der Wunsch noch wichtig ist.</P>
            </Card>
          ) : null}

          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => shiftMonth(-1)} accessibilityRole="button" accessibilityLabel="Monat davor" style={s.back}><Icon name="chevron-left" color={C.gold} /></Pressable>
              <Text style={[s.goalName, { flex: 1, textAlign: 'center' }]}>{monthName}</Text>
              <Pressable onPress={() => month < store.today.slice(0, 7) && shiftMonth(1)} accessibilityRole="button" accessibilityLabel="Monat danach" style={[s.back, month >= store.today.slice(0, 7) && { opacity: 0.25 }]}><Icon name="chevron-right" color={C.gold} /></Pressable>
            </View>
            {ms.count === 0 ? <P dim>In diesem Monat gibt es noch keine Einträge.</P> : (
              <>
                <P>Bekommen: {formatEuro(ms.income)}</P>
                <P>Ausgegeben: {formatEuro(ms.spent)}{ms.spentWant || ms.spentNeed ? ` (Wünsche ${formatEuro(ms.spentWant)}, Bedürfnisse ${formatEuro(ms.spentNeed)})` : ''}</P>
                <P>Geteilt: {formatEuro(ms.shared)}</P>
                {ms.goalsBought ? <P>Sparziele erfüllt: {formatEuro(ms.goalsBought)}</P> : null}
              </>
            )}
          </Card>

          <H2>Ylva erklärt</H2>
          <Grid cols={tablet ? 2 : 1} gap={10}>
            {lessonsFor(stage).map((l) =>
              lo.open.has(l.id) ? (
                <Card key={l.id} onPress={() => { setLesson(l); store.markLesson(l.id); }} label={'Lektion ' + l.title} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name={state.lessons[l.id] ? 'check-circle' : 'book-open-page-variant-outline'} color={state.lessons[l.id] ? C.mint : C.gold} />
                  <Text style={[s.entryText, { flex: 1 }]}>{state.lessons[l.id] ? l.title : 'Neu: ' + l.title}</Text>
                  <Icon name="chevron-right" color={C.dim} />
                </Card>
              ) : (
                <View key={l.id} accessibilityLabel={'Lektion ' + l.title + ', noch verschlossen'} style={[s.lessonLocked, { flex: 1 }]}>
                  <Icon name="lock-outline" color={C.dim} />
                  <Text style={[s.entryText, { flex: 1, color: C.dim }]}>{l.title}</Text>
                </View>
              ),
            )}
          </Grid>
          <P dim>{lo.waitDays >= 2 ? 'In zwei Tagen erzählt Ylva dir die nächste Lektion.' : lo.waitDays === 1 ? 'Morgen erzählt Ylva dir die nächste Lektion.' : 'Alle zwei Tage erzählt Ylva dir eine neue Lektion.'}</P>
        </>
      ) : (
        <Card>
          <H2>Mehr mit Premium</H2>
          <P dim>Mehrere Sparziele, eine Wunschliste mit „eine Woche warten“, die Monatsübersicht und kleine Geld-Lektionen von Ylva.</P>
        </Card>
      )}

      <Grid cols={tablet ? 2 : 1}>

      <Card onPress={() => open('split')} label="Aufteilung ändern" style={{ flex: 1 }}>
        <H2>Aufteilung</H2>
        <P>Sparen {m.split.save} % · Ausgeben {m.split.spend} % · Teilen {m.split.share} %</P>
        <P dim>Leg die Aufteilung gemeinsam mit deinen Eltern fest. Antippen zum Ändern.</P>
      </Card>
      </Grid>

      <H2>Verlauf</H2>
      {m.entries.length === 0 ? <P dim>Noch keine Einträge.</P> : null}
      {[...m.entries].reverse().slice(0, 50).map((e) => (
        <EntryRow key={e.id} e={e} onDelete={async () => (await ask('Eintrag löschen?', 'Der Eintrag wird aus dem Verlauf entfernt.', 'Löschen')) && store.deleteEntry(e.id)} />
      ))}

      <P dim style={{ textAlign: 'center', marginTop: 6 }}>Habivale ist nur ein Tracker: kein echtes Geld, keine Bankverbindung.</P>

      <Sheet visible={mode !== null} onClose={close} title={mode === 'allowance' ? 'Taschengeld eintragen' : mode === 'spend' ? 'Ausgeben' : mode === 'share' ? 'Teilen' : mode === 'move' ? 'Umbuchen' : mode === 'goal' ? 'Sparziel' : 'Aufteilung'}>
        {mode === 'split' ? (
          <>
            {JARS.map((j) => (
              <View key={j} style={{ gap: 6 }}>
                <P style={{ color: JAR_COLOR[j], fontFamily: F.bold }}>{JAR_NAME[j]}: {split[j]} %</P>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Chip title="− 5" on={false} onPress={() => setSplitDraft({ ...split, [j]: Math.max(0, split[j] - 5) })} />
                  <Chip title="+ 5" on={false} onPress={() => setSplitDraft({ ...split, [j]: Math.min(100, split[j] + 5) })} />
                </View>
              </View>
            ))}
            <P dim>Zusammen: {split.save + split.spend + split.share} % {isValidSplit(split) ? '✓' : '(muss genau 100 % sein)'}</P>
            <Button title="Speichern" onPress={submit} disabled={!isValidSplit(split)} />
          </>
        ) : (
          <>
            {mode === 'goal' ? (
              <>
                <Field label="Wofür sparst du?" value={goalName} onChangeText={setGoalName} placeholder="z. B. Fahrrad" maxLength={40} />
                <View style={s.row}>
                  {GOAL_ICONS.map((ic) => (
                    <Pressable key={ic} onPress={() => setGoalIcon(ic)} accessibilityRole="radio" aria-checked={goalIcon === ic} accessibilityLabel={ic} style={[s.icon, { width: 64, height: 64 }, goalIcon === ic && { borderColor: C.jarSave, borderWidth: 3, backgroundColor: 'rgba(226,188,102,0.15)' }]}>
                      {GOAL_IMG[ic] ? <Image source={GOAL_IMG[ic]} style={{ width: 50, height: 50 }} contentFit="contain" /> : <Icon name={ic} size={26} color={C.jarSave} />}
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
            <Field label={mode === 'goal' ? 'Zielbetrag in €' : 'Betrag in €'} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="z. B. 2,50" autoFocus={mode !== 'goal'} />
            {mode === 'move' ? (
              <>
                <P dim>Von</P>
                <View style={s.row}>{JARS.map((j) => <Chip key={j} title={JAR_NAME[j]} color={JAR_COLOR[j]} on={from === j} onPress={() => setFrom(j)} />)}</View>
                <P dim>Nach</P>
                <View style={s.row}>{JARS.map((j) => <Chip key={j} title={JAR_NAME[j]} color={JAR_COLOR[j]} on={to === j} onPress={() => setTo(j)} />)}</View>
              </>
            ) : null}
            {mode !== 'goal' ? (
              <Field
                label={mode === 'allowance' ? 'Von wem? (freiwillig)' : mode === 'spend' ? 'Wofür?' : mode === 'share' ? 'Für wen oder wofür?' : 'Warum buchst du um?'}
                value={note}
                onChangeText={setNote}
                maxLength={60}
                placeholder={mode === 'allowance' ? 'z. B. von Oma' : ''}
              />
            ) : null}
            {mode === 'spend' ? (
              <>
                <P>Ist das ein Wunsch oder ein Bedürfnis?</P>
                <View style={s.row}>
                  <Chip title="Wunsch" on={need === 'want'} onPress={() => setNeed('want')} />
                  <Chip title="Bedürfnis" on={need === 'need'} onPress={() => setNeed('need')} />
                </View>
                <P dim>Beides ist in Ordnung – die Frage hilft beim Nachdenken.</P>
              </>
            ) : null}
            {preview ? (
              <View style={s.row}>
                {JARS.map((j) => (
                  <P key={j} style={{ color: JAR_COLOR[j] }}>{JAR_NAME[j]} {formatEuro(preview[j])}</P>
                ))}
              </View>
            ) : null}
            {amount && !cents ? <P style={{ color: '#F2A7A0' }}>Bitte einen Betrag wie 2,50 eingeben.</P> : null}
            <Button title={mode === 'goal' ? 'Ziel speichern' : 'Eintragen'} onPress={submit} disabled={!cents} />
            {mode === 'spend' && premium ? (
              <Button
                title="Lieber eine Woche warten"
                kind="ghost"
                icon="timer-sand"
                disabled={!cents}
                onPress={() => {
                  store.addWish(note.trim() || 'Mein Wunsch', cents!);
                  close();
                  tell('Auf der Wunschliste', 'In einer Woche fragt dich Habivale, ob dir der Wunsch noch wichtig ist.');
                }}
              />
            ) : null}
            {mode === 'goal' && goalId ? (
              <Button title="Sparziel entfernen" kind="danger" onPress={async () => { if (await ask('Sparziel entfernen?', 'Das Geld bleibt im Sparglas.', 'Entfernen')) { store.deleteSavingsGoal(goalId); close(); } }} />
            ) : null}
          </>
        )}
      </Sheet>

      <Sheet visible={!!lesson} onClose={() => setLesson(null)} title={lesson?.title ?? ''}>
        {lesson ? (
          <>
            {lesson.text.map((x, i) => <P key={i}>{x}</P>)}
            <P style={{ color: C.gold, fontFamily: F.bold }}>Zum Nachdenken: {lesson.question}</P>
            <Button title="Danke!" onPress={() => setLesson(null)} />
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function EntryRow({ e, onDelete }: { e: MoneyEntry; onDelete: () => void }) {
  const label =
    e.kind === 'allowance' ? 'Taschengeld' + (e.note ? ' ' + e.note : '') :
    e.kind === 'spend' ? 'Ausgegeben' + (e.note ? ': ' + e.note : '') + (e.need === 'want' ? ' (Wunsch)' : e.need === 'need' ? ' (Bedürfnis)' : '') :
    e.kind === 'share' ? 'Geteilt' + (e.note ? ': ' + e.note : '') :
    e.kind === 'savebuy' ? 'Sparziel erfüllt: ' + e.note :
    `Umgebucht ${JAR_NAME[e.from]} → ${JAR_NAME[e.to]}` + (e.note ? ': ' + e.note : '');
  const sign = e.kind === 'allowance' ? '+' : e.kind === 'move' ? '' : '−';
  return (
    <View style={s.entry}>
      <View style={{ flex: 1 }}>
        <Text style={s.entryText}>{label}</Text>
        <Text style={s.entryDate}>{shortDateDe(e.day)}</Text>
      </View>
      <Text style={s.entryAmt}>{sign}{formatEuro(e.cents)}</Text>
      <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Eintrag löschen" style={s.del}>
        <Icon name="trash-can-outline" size={20} color={C.dim} />
      </Pressable>
    </View>
  );
}

const GOAL_ICONS = ['piggy-bank-outline', 'bike', 'book-open-variant', 'gamepad-variant-outline', 'teddy-bear', 'music', 'soccer', 'palette-outline', 'headphones', 'gift-outline'];

const s = StyleSheet.create({
  lessonLocked: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.line, opacity: 0.6 },
  goalName: { fontFamily: F.bold, fontSize: 17, color: C.text },
  icon: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  jars: { flexDirection: 'row', justifyContent: 'space-around' },
  jar: { alignItems: 'center', gap: 4 },
  jarName: { fontFamily: F.bold, fontSize: 15 },
  jarVal: { fontFamily: F.title, fontSize: 17, color: C.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 8 },
  entryText: { fontFamily: F.text, fontSize: 16, color: C.text },
  entryDate: { fontFamily: F.text, fontSize: 13, color: C.dim },
  entryAmt: { fontFamily: F.bold, fontSize: 16, color: C.text },
  del: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
