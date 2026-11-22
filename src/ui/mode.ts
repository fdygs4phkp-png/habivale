// Kinder-Modus: für Kinderprofile von 8–11 Jahren (Alter aus dem Geburtsjahr) – oder zum Ansehen über den Test-Schalter.
import { ageStage, type AgeStage } from '../logic/types.ts';
import { useStore } from '../state/store';

export function useMode(): { kid: boolean; stage: AgeStage; k: number } {
  const { state } = useStore();
  const stage: AgeStage = state.family?.role === 'child' ? ageStage(state.family.birthYear) : 'erwachsen';
  const kid = stage === 'kind' || !!state.kidPreview;
  return { kid, stage: kid ? 'kind' : stage, k: kid ? 1.15 : 1 };
}
