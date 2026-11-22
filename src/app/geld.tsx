import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { shortDateDe } from '../logic/date.ts';
import { balances, fillLevel, formatEuro, isValidSplit, JARS, parseEuro, splitCents } from '../logic/money.ts';
import type { Jar, MoneyEntry } from '../logic/types.ts';
import { useStore } from '../state/store';
import { ask, Bar, Button, Card, Chip, Field, H2, Icon, JarPicture, P, PlaceholderNote, Screen, Sheet, tell } from '../ui/kit';
import { C, F, JAR_COLOR, JAR_NAME } from '../ui/theme';

type Mode = null | 'allowance' | 'spend' | 'share' | 'move' | 'goal' | 'split';

export default function Money() {
  const store = useStore();
  const { state } = store;
  const m = state.money;
  const b = balances(m.entries);
  const [mode, setMode] = useState<Mode>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [need, setNeed] = useState<'want' | 'need' | null>(null);
  const [from, setFrom] = useState<Jar>('save');
  const [to, setTo] = useState<Jar>('spend');
  const [goalName, setGoalName] = useState(m.goal?.name ?? '');
  const [split, setSplitDraft] = useState(m.split);

  const open = (md: Mode) => {
    setAmount('');
    setNote('');
    setNeed(null);
    setGoalName(m.goal?.name ?? '');
    if (md === 'goal' && m.goal) setAmount((m.goal.cents / 100).toString().replace('.', ','));
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
    else if (mode === 'goal') store.setGoal({ name: goalName.trim() || 'Mein Sparziel', icon: 'piggy-bank', cents, reachedAt: null });
    if (!okay) {
      const jar: Jar = mode === 'spend' ? 'spend' : mode === 'share' ? 'share' : from;
      if (mode === 'move' && !note.trim()) return tell('Kurze Begründung', 'Schreib kurz auf, warum du umbuchst.');
      return tell('Nicht genug im Glas', `Im Glas „${JAR_NAME[jar]}“ sind ${formatEuro(b[jar])}.`);
    }
    close();
  };

  const preview = mode === 'allowance' && cents ? splitCents(cents, m.split) : null;
  const goal = m.goal;

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
              <JarPicture color={JAR_COLOR[j]} level={fillLevel(j, m.entries, goal?.cents ?? null)} />
              <Text style={[s.jarName, { color: JAR_COLOR[j] }]}>{JAR_NAME[j]}</Text>
              <Text style={s.jarVal}>{formatEuro(b[j])}</Text>
            </View>
          ))}
        </View>
        <PlaceholderNote text="Platzhalter – die gemalten Gläser folgen" />
      </Card>

      <Button title="Taschengeld eintragen" icon="plus" onPress={() => open('allowance')} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Button title="Ausgeben" kind="ghost" onPress={() => open('spend')} /></View>
        <View style={{ flex: 1 }}><Button title="Teilen" kind="ghost" onPress={() => open('share')} /></View>
      </View>
      <Button title="Umbuchen" kind="ghost" icon="swap-horizontal" onPress={() => open('move')} />

      <Card onPress={() => open('goal')} label="Sparziel bearbeiten">
        <H2>Mein Sparziel</H2>
        {goal ? (
          <>
            <P>{goal.name}: {formatEuro(Math.min(b.save, goal.cents))} von {formatEuro(goal.cents)}</P>
            <Bar value={b.save / goal.cents} color={C.jarSave} height={14} />
            {goal.reachedAt ? <P style={{ color: C.mint, fontFamily: F.bold }}>Geschafft! Dein Sparglas hat das Ziel erreicht.</P> : <P dim>Noch {formatEuro(Math.max(0, goal.cents - b.save))}</P>}
          </>
        ) : (
          <P dim>Wofür sparst du? Tippe hier und leg ein Ziel fest – zum Beispiel ein Buch oder ein Fahrrad.</P>
        )}
      </Card>

      <Card onPress={() => open('split')} label="Aufteilung ändern">
        <H2>Aufteilung</H2>
        <P>Sparen {m.split.save} % · Ausgeben {m.split.spend} % · Teilen {m.split.share} %</P>
        <P dim>Legt die Aufteilung gemeinsam mit euren Eltern fest. Antippen zum Ändern.</P>
      </Card>

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
            {mode === 'goal' ? <Field label="Wofür sparst du?" value={goalName} onChangeText={setGoalName} placeholder="z. B. Fahrrad" maxLength={40} /> : null}
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
            {mode === 'goal' && goal ? <Button title="Sparziel entfernen" kind="danger" onPress={() => { store.setGoal(null); close(); }} /> : null}
          </>
        )}
      </Sheet>
    </Screen>
  );
}

function EntryRow({ e, onDelete }: { e: MoneyEntry; onDelete: () => void }) {
  const label =
    e.kind === 'allowance' ? 'Taschengeld' + (e.note ? ' ' + e.note : '') :
    e.kind === 'spend' ? 'Ausgegeben' + (e.note ? ': ' + e.note : '') + (e.need === 'want' ? ' (Wunsch)' : e.need === 'need' ? ' (Bedürfnis)' : '') :
    e.kind === 'share' ? 'Geteilt' + (e.note ? ': ' + e.note : '') :
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

const s = StyleSheet.create({
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
