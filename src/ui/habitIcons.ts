// Symbole für Gewohnheiten (MaterialCommunityIcons)
export const HABIT_ICONS = [
  'book-open-variant', 'toothbrush', 'cup-water', 'run', 'bed', 'music-note', 'pencil', 'broom',
  'food-apple', 'walk', 'heart-outline', 'star-outline', 'dog', 'flower-outline', 'bike', 'brain',
  'meditation', 'palette-outline', 'school-outline', 'hand-heart-outline', 'sprout-outline', 'weather-night',
];

/** Vorlagen zum Antippen (im Kinder-Modus groß, sonst als „Ideen“). */
export const HABIT_TEMPLATES: { name: string; icon: string; days?: number[] }[] = [
  { name: 'Zähne putzen', icon: 'toothbrush' },
  { name: 'Lesen', icon: 'book-open-variant' },
  { name: 'Zimmer aufräumen', icon: 'broom' },
  { name: 'Wasser trinken', icon: 'cup-water' },
  { name: 'Hausaufgaben', icon: 'pencil', days: [1, 2, 3, 4, 5] },
  { name: 'Bewegen', icon: 'run' },
  { name: 'Früh ins Bett', icon: 'bed' },
  { name: 'Musik üben', icon: 'music-note' },
  { name: 'Tier versorgen', icon: 'dog' },
  { name: 'Obst essen', icon: 'food-apple' },
  { name: 'Draußen spielen', icon: 'bike' },
  { name: 'Jemandem helfen', icon: 'hand-heart-outline' },
];
