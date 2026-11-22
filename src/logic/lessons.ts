// Kurze Geld-Lektionen der Mentorin, nach Alter (Master-Prompt Abschnitt 20). Freiwillig, nie Pflicht.
import type { AgeStage } from './types.ts';

export interface Lesson {
  id: string;
  stage: AgeStage;
  title: string;
  text: string[];
  question: string;
}

export const LESSONS: Lesson[] = [
  {
    id: 'k-sparen',
    stage: 'kind',
    title: 'Was ist Sparen?',
    text: [
      'Sparen heißt: Du legst etwas Geld zur Seite, statt es gleich auszugeben.',
      'Jeden Tag ein kleines Stück – und eines Tages reicht es für etwas Großes.',
      'Dein goldenes Glas hilft dir dabei. Es wird voller, auch wenn du nur wenig hineinlegst.',
    ],
    question: 'Wofür würdest du gern sparen?',
  },
  {
    id: 'k-wunsch',
    stage: 'kind',
    title: 'Wunsch oder Bedürfnis?',
    text: [
      'Ein Bedürfnis ist etwas, das du wirklich brauchst – zum Beispiel ein Heft für die Schule.',
      'Ein Wunsch ist etwas, das schön wäre – zum Beispiel ein neues Spielzeug.',
      'Wünsche sind nichts Schlechtes! Es hilft nur, den Unterschied zu kennen.',
    ],
    question: 'Was war dein letzter Wunsch – und was dein letztes Bedürfnis?',
  },
  {
    id: 'k-teilen',
    stage: 'kind',
    title: 'Warum Teilen Freude macht',
    text: [
      'Mit deinem grünen Glas kannst du anderen eine Freude machen.',
      'Ein kleines Geschenk, eine Spende für Tiere oder für Menschen, die Hilfe brauchen.',
      'Oft freut man sich beim Geben genauso wie beim Bekommen.',
    ],
    question: 'Wem möchtest du einmal etwas schenken?',
  },
  {
    id: 'k-warten',
    stage: 'kind',
    title: 'Die Zauberkraft des Wartens',
    text: [
      'Manchmal möchten wir etwas sofort haben.',
      'Wenn du eine Woche wartest, merkst du: Ist es mir wirklich wichtig?',
      'Was nach einer Woche noch wichtig ist, ist meistens ein guter Wunsch.',
    ],
    question: 'Gibt es etwas, das du gern sofort hättest?',
  },
  {
    id: 'j-plan',
    stage: 'jugend',
    title: 'Dein Taschengeld-Plan',
    text: [
      'Ein Plan sagt deinem Geld, wohin es gehen soll – bevor du es ausgibst.',
      'Die drei Gläser sind schon ein Plan: Sparen, Ausgeben, Teilen.',
      'Schau einmal im Monat: Passt die Aufteilung noch zu deinen Zielen?',
    ],
    question: 'Welche Aufteilung passt gerade am besten zu dir?',
  },
  {
    id: 'j-werbung',
    stage: 'jugend',
    title: 'Werbung durchschauen',
    text: [
      'Werbung will, dass du etwas haben möchtest – oft sofort.',
      'Achte auf Sätze wie „nur heute“ oder „alle haben es schon“. Sie machen Druck.',
      'Frag dich: Würde ich es auch wollen, wenn ich die Werbung nie gesehen hätte?',
    ],
    question: 'Welche Werbung ist dir zuletzt aufgefallen?',
  },
  {
    id: 'j-ziel',
    stage: 'jugend',
    title: 'Ein Sparziel mit Datum',
    text: [
      'Ein Ziel mit Datum ist leichter zu erreichen.',
      'Teile den Betrag durch die Wochen bis dahin – dann weißt du, wie viel du jede Woche zur Seite legen musst.',
      'Beispiel: 60 € in 12 Wochen sind 5 € pro Woche.',
    ],
    question: 'Bis wann möchtest du dein Sparziel erreichen?',
  },
  {
    id: 'j-konto',
    stage: 'jugend',
    title: 'Konten einfach erklärt',
    text: [
      'Ein Girokonto ist für das Geld, das du im Alltag brauchst.',
      'Ein Sparkonto ist für Geld, das liegen bleiben soll.',
      'Für Jugendliche gibt es oft kostenlose Konten – frag deine Eltern danach.',
    ],
    question: 'Welche Fragen hättest du an deine Bank?',
  },
  {
    id: 'e-budget',
    stage: 'erwachsen',
    title: 'Ein einfaches Budget',
    text: [
      'Schreib auf, was im Monat hereinkommt und was fest weggeht.',
      'Was übrig bleibt, verteilst du bewusst – auf Sparen, Freizeit und Teilen.',
      'Ein Budget ist kein Verbot, sondern ein Kompass.',
    ],
    question: 'Welche festen Ausgaben hast du jeden Monat?',
  },
  {
    id: 'e-zins',
    stage: 'erwachsen',
    title: 'Zinseszins – einfach erklärt',
    text: [
      'Wenn gespartes Geld Zinsen bekommt, bekommen beim nächsten Mal auch die Zinsen Zinsen.',
      'Dadurch wächst es mit der Zeit immer schneller.',
      'Das Wichtigste ist darum nicht der Betrag, sondern früh anzufangen.',
    ],
    question: 'Was könntest du schon heute regelmäßig zur Seite legen?',
  },
  {
    id: 'e-vertrag',
    stage: 'erwachsen',
    title: 'Verträge, zum Beispiel fürs Handy',
    text: [
      'Ein Vertrag läuft oft lange und kostet jeden Monat.',
      'Achte auf die Laufzeit, die Kündigungsfrist und was nach der Werbe-Zeit passiert.',
      'Manchmal ist ein Prepaid-Tarif am Ende günstiger.',
    ],
    question: 'Welche Verträge hast du – und wann kannst du sie kündigen?',
  },
];

export function lessonsFor(stage: AgeStage): Lesson[] {
  const order: AgeStage[] = ['kind', 'jugend', 'erwachsen'];
  // Die eigene Stufe zuerst, dann die leichteren (zum Nachlesen)
  const i = order.indexOf(stage);
  return [...LESSONS.filter((l) => l.stage === stage), ...LESSONS.filter((l) => order.indexOf(l.stage) < i)];
}
