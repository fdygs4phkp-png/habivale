// Designsystem aus dem Phase-1-Plan (Kontraste gemessen: alle Paare über 4,5 : 1).
export const C = {
  bg: '#0E1630', // Nachtblau
  card: '#1A2448', // Kartenblau
  cardHi: '#222E5A',
  violet: '#3B2364',
  forest: '#1F4D3A',
  gold: '#E2BC66',
  goldDim: 'rgba(226,188,102,0.35)',
  text: '#F3EBD6', // Pergament
  dim: '#C2BBA8',
  lavender: '#C9B3F0',
  mint: '#9FD8B5',
  line: 'rgba(243,235,214,0.14)',
  jarSave: '#E2BC66',
  jarSpend: '#B08AF0',
  jarShare: '#7FCB9E',
};

export const F = {
  title: 'Cinzel',
  text: 'Atkinson',
  bold: 'AtkinsonBold',
};

export const S = {
  pad: 16,
  radius: 16,
  tap: 48,
};

export const JAR_COLOR = { save: C.jarSave, spend: C.jarSpend, share: C.jarShare } as const;
export const JAR_NAME = { save: 'Sparen', spend: 'Ausgeben', share: 'Teilen' } as const;
