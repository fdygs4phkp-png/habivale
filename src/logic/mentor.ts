// Besuche im Hexenhaus (Phase 5): Rat des Tages (passt zur Lage) und die Geschichten der Mentorin.
// Je Besuchstag öffnet sich eine neue Geschichte (der Reihe nach). Alles eigene Texte.

import { activeDays, dueHabits, isDone } from './habits.ts';
import { daysBetween, type DayKey } from './date.ts';
import { wishDue } from './money.ts';
import { wolfStage } from './progress.ts';
import { refugeStage, sceneOf } from './refuge.ts';
import type { AppState } from './types.ts';

export interface Tale {
  title: string;
  text: string;
  /** Was die Mentorin danach sagt – der Gedanke der Geschichte in einem Satz */
  moral: string;
}

export const TALES: Tale[] = [
  {
    title: 'Der Tropfen und der Stein',
    text: 'Am Rand meines Gartens liegt ein großer Stein. Jeden Morgen fällt ein einziger Tropfen Tau von einem Blatt auf ihn. Ein Tropfen ist nichts. Aber schaut genau hin: In der Mitte des Steins ist eine kleine Mulde. Die hat kein Sturm gemacht und kein Hammer – nur der Tropfen, Tag für Tag, seit vielen Jahren.',
    moral: 'Kleine Dinge, oft getan, verändern sogar Stein.',
  },
  {
    title: 'Die Eichhörnchen-Vorräte',
    text: 'Zwei Eichhörnchen wohnten im selben Baum. Das eine sammelte im Herbst jeden Tag drei Nüsse. Das andere schlief lange und wollte am letzten warmen Tag alles auf einmal holen. Doch an diesem Tag regnete es. Im Winter teilte das erste Eichhörnchen seine Nüsse – und das zweite sammelte im nächsten Herbst jeden Tag drei.',
    moral: 'Wer jeden Tag ein bisschen tut, muss nicht alles an einem Tag schaffen.',
  },
  {
    title: 'Der krumme Zaun',
    text: 'Als ich jung war, baute ich einen Zaun. Der dritte Pfosten stand schief. Ich ärgerte mich so sehr, dass ich aufhören wollte. Meine Lehrerin sagte nur: „Setz den vierten gerade.“ Der Zaun steht heute noch. Den schiefen Pfosten sieht man kaum – aber ohne die anderen gäbe es keinen Zaun.',
    moral: 'Ein Fehler ist kein Grund aufzuhören. Mach einfach den nächsten Schritt richtig.',
  },
  {
    title: 'Die Laterne im Nebel',
    text: 'Einmal verirrte ich mich im Nebel. Ich konnte den Weg nach Hause nicht sehen, nur die drei Steine vor meinen Füßen im Licht meiner kleinen Laterne. Also ging ich drei Steine weit. Dann wieder drei. Und irgendwann stand ich vor meiner Tür.',
    moral: 'Ihr müsst nicht den ganzen Weg sehen. Es reicht, den nächsten Schritt zu sehen.',
  },
  {
    title: 'Das Geschenk der Spinne',
    text: 'Eine Spinne baute ihr Netz am Fenster. Der Wind riss es dreimal kaputt. Beim vierten Mal baute sie es eine Handbreit tiefer, wo der Wind nicht so stark war. Dort hielt es den ganzen Sommer.',
    moral: 'Wenn etwas nicht klappt, gebt nicht auf – probiert es ein bisschen anders.',
  },
  {
    title: 'Der Brunnen im Dorf',
    text: 'Im Dorf hinter dem Wald gab es einen Brunnen. Jeder, der Wasser holte, goss eine Kelle in den Trog für die Tiere. Eine Kelle ist wenig. Aber am Abend tranken dort Rehe, Füchse und Vögel – genug für alle.',
    moral: 'Teilen muss nicht groß sein. Wenn viele ein wenig geben, reicht es für alle.',
  },
  {
    title: 'Der Samen, der nicht wuchs',
    text: 'Kael hat mir einmal einen Samen gezeigt. „Er wächst nicht“, sagte er. „Ich gieße ihn seit zehn Tagen.“ Wir gruben vorsichtig nach. Unter der Erde hatte der Samen schon lange Wurzeln geschlagen – man konnte sie nur nicht sehen. Drei Tage später kam das erste Blatt.',
    moral: 'Auch wenn ihr noch nichts seht: Es wächst schon.',
  },
  {
    title: 'Die müde Eule',
    text: 'Eine junge Eule wollte jede Nacht die beste Jägerin sein und flog ohne Pause. Nach einer Woche war sie so müde, dass sie gar nicht mehr fliegen konnte. Die alte Eule sagte: „Auch die Nacht hat Pausen. Ruh dich aus – morgen fliegst du besser.“',
    moral: 'Ausruhen gehört dazu. Wer sich Pausen gönnt, bleibt länger dran.',
  },
  {
    title: 'Der Wunsch im Schaufenster',
    text: 'Lyra sah auf dem Markt eine glitzernde Haarspange und wollte sie sofort kaufen. „Warte eine Woche“, sagte ich. Nach drei Tagen hatte sie die Spange fast vergessen. Nach einer Woche kaufte sie lieber neue Perlen für ihre Zöpfe – die wollte sie schon lange.',
    moral: 'Was man sich wirklich wünscht, ist nach einer Woche immer noch da.',
  },
  {
    title: 'Der Wolf und die Spur',
    text: 'Ein Wolf findet seinen Weg im Winter, indem er in seine eigene Spur vom Vortag tritt. Der Schnee ist dort schon fest, und das Laufen wird leichter. Jeden Tag ein bisschen leichter.',
    moral: 'Was ihr jeden Tag tut, wird von selbst leichter – wie ein Weg, den man oft geht.',
  },
  {
    title: 'Die zwei Gärten',
    text: 'Zwei Schwestern legten je einen Garten an. Die eine wollte alles auf einmal: Rosen, Kräuter, Kürbisse, einen Teich. Nach einem Monat war alles verwildert. Die andere pflanzte nur Kräuter und pflegte sie gut. Im nächsten Jahr kamen Rosen dazu, dann Kürbisse. Ihr Garten wurde der schönste im Tal.',
    moral: 'Fangt mit wenig an und macht es gut. Mehr kommt später von allein.',
  },
  {
    title: 'Der Stern über dem Haus',
    text: 'In der Nacht, in der ihr den Welpen zu euch genommen habt, stand ein heller Stern über eurer Hütte. Ich sehe ihn jeden Abend noch. Er leuchtet nicht stärker, wenn ihr etwas Großes schafft, und nicht schwächer, wenn ein Tag nicht gelingt. Er ist einfach da – wie ich.',
    moral: 'Ihr müsst nicht perfekt sein. Kommt einfach wieder, ich bin da.',
  },
];

export const ADVICE_POOL: string[] = [
  'Ein großer Traum ist wie ein ferner Berg. Ihr erreicht ihn mit vielen kleinen Schritten.',
  'Schreibt euch heute auf, was gut gelaufen ist. Auch Kleinigkeiten zählen.',
  'Wenn ein Tag schwer ist, macht nur die kleinste Gewohnheit. Das reicht.',
  'Euer Wolf merkt sich nicht, wie viel ihr schafft, sondern dass ihr da seid.',
  'Vergleicht euch nicht mit anderen. Vergleicht euch mit euch von letzter Woche.',
  'Eine Gewohnheit wächst am besten an derselben Stelle im Tag – wie eine Pflanze am selben Fenster.',
  'Wer teilt, hat am Ende oft mehr: Freunde, Dank und ein warmes Herz.',
  'Sparen heißt nicht verzichten. Es heißt: später etwas haben, das euch wirklich wichtig ist.',
  'Ein Fehler ist ein Wegweiser, kein Stoppschild.',
  'Freut euch über jeden Haken. Ihr habt ihn euch verdient.',
  'Pausen sind kein Aufgeben. Auch die Bäume ruhen im Winter.',
  'Fragt euch abends: Was hat mir heute Mut gemacht?',
  'Hilfe annehmen ist auch eine Stärke.',
  'Die beste Zeit für einen Neuanfang ist heute.',
];

const SEASON_ADVICE: Record<string, string> = {
  spring: 'Draußen wächst alles wieder. Vielleicht ist jetzt eine gute Zeit für eine neue kleine Gewohnheit?',
  summer: 'Die Tage sind lang. Nutzt das Licht – aber vergesst nicht, genug zu trinken und zu schlafen.',
  autumn: 'Im Herbst sammeln die Tiere Vorräte. Was sammelt ihr gerade – Nüsse, Mut oder Taler im Sparglas?',
  winter: 'Im Winter wird es früh dunkel. Ein warmes Getränk und ein gutes Buch sind jetzt die beste Gewohnheit.',
  xmas: 'Die Weihnachtszeit ist eine Zeit zum Teilen. Wem könntet ihr heute eine kleine Freude machen?',
};

function dayIndex(today: DayKey): number {
  return Math.abs(daysBetween('2026-01-01', today));
}

/** Rat des Tages: das Wichtigste zur Lage, sonst ein Gedanke aus dem Vorrat. Am selben Tag immer derselbe. */
export function adviceFor(s: AppState, today: DayKey): { title: string; text: string } {
  const days = activeDays(s.habits, s.done);
  const last = days[days.length - 1];
  const due = dueHabits(s.habits, today);
  if (s.habits.filter((h) => !h.archived).length === 0)
    return { title: 'Fangt klein an', text: 'Sucht euch eine einzige, kleine Gewohnheit aus – so klein, dass ihr sie gar nicht vergessen könnt. Morgen erzähle ich euch, wie es weitergeht.' };
  if (due.length > 0 && due.every((h) => isDone(s.done, h.id, today)))
    return { title: 'Heute alles geschafft!', text: 'Ihr habt heute alles erledigt. Setzt euch zu mir ans Feuer – ihr habt euch eine Pause verdient.' };
  if (last && daysBetween(last, today) >= 3)
    return { title: 'Schön, dass ihr wieder da seid', text: 'Ein paar Tage sind vergangen. Das macht nichts. Euer Wolf hat auf euch gewartet. Fangt heute mit einer einzigen Gewohnheit wieder an.' };
  if (s.money.wishes.some((w) => w.answer === null && wishDue(w, today)))
    return { title: 'Eine Woche ist um', text: 'Auf eurer Wunschliste wartet ein Wunsch. Fragt euch ehrlich: Wollt ihr ihn noch? Schaut bei den drei Gläsern nach.' };
  const r = refugeStage(s);
  if (r.next && r.toNext > 0 && r.toNext <= 3)
    return { title: 'Bald wächst euer Haus', text: `Noch ${r.toNext} aktive ${r.toNext === 1 ? 'Tag' : 'Tage'}, dann wird aus eurem Zuhause „${r.next.name}“. Ich bin gespannt!` };
  const w = wolfStage(s.habits, s.done);
  if (w.next && w.toNext > 0 && w.toNext <= 5)
    return { title: 'Euer Wolf wird größer', text: `Noch ${w.toNext} aktive ${w.toNext === 1 ? 'Tag' : 'Tage'}, dann ist er ein ${w.next.name}. Er spürt schon, dass etwas passiert.` };
  const i = dayIndex(today);
  if (i % 3 === 0) return { title: 'Ein Gedanke zur Jahreszeit', text: SEASON_ADVICE[sceneOf(today)] };
  return { title: 'Rat des Tages', text: ADVICE_POOL[i % ADVICE_POOL.length] };
}

/** Besuchstage, ältester zuerst. */
export function visitDays(s: AppState): DayKey[] {
  return Object.keys(s.visits || {}).sort();
}

/** Wie viele Geschichten offen sind: eine je Besuchstag (höchstens alle). */
export function talesOpen(s: AppState): number {
  return Math.min(TALES.length, visitDays(s).length);
}

/** Die Geschichte, die an diesem Besuchstag neu dazukam (oder null, wenn heute keine neue kam). */
export function taleOfDay(s: AppState, today: DayKey): number | null {
  const d = visitDays(s);
  const i = d.indexOf(today);
  return i >= 0 && i < TALES.length ? i : null;
}
