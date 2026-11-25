import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dayKey } from '../../logic/date.ts';
import { partId, storyOpen, type Lane } from '../../logic/story.ts';
import { levelInfo, wolfStage, WOLF_STAGES } from '../../logic/progress.ts';
import { keptWolf, xpOf } from '../../logic/trophies.ts';
import { BACKSTORY, OUTFITS, RARITY_COLOR, RARITY_NAME, ruleMet, ruleText, STORY_CHAPTERS } from '../../logic/world.ts';
import { useStore } from '../../state/store';
import { BACKSTORY_IMG, BACKSTORY_IMG_MISSING, IMG, OUTFIT_IMG, STORY_IMG, STORY_IMG_MISSING, STORY_INLINE } from '../../ui/images';
import { Bar, Button, Card, Grid, H2, Icon, P, PlaceholderNote, Screen, useLayout } from '../../ui/kit';
import { C, F } from '../../ui/theme';


export default function Adventure() {
  const { state, setHero, today } = useStore();
  const { tablet } = useLayout();
  const xp = xpOf(state);
  const lv = levelInfo(xp);
  const w0 = wolfStage(state.habits, state.done, keptWolf(state));
  const premium = state.premium;
  // Ohne Premium bleibt der Wolf ein Welpe (die Fortschritte zählen trotzdem weiter und sind mit Premium sofort da)
  const w = premium ? w0 : { ...w0, index: 0, stage: WOLF_STAGES[0], next: WOLF_STAGES[1], toNext: Math.max(0, WOLF_STAGES[1].days - w0.activeDays) };
  const hero = state.hero;
  const outfit = OUTFITS.find((o) => o.id === state.outfits[hero]) ?? OUTFITS.find((o) => o.id === hero + '-start')!;
  const heroName = hero === 'lyra' ? 'Lyra' : 'Kael';
  const outfitImg = OUTFIT_IMG[outfit.id];

  return (
    <Screen gear title="Abenteuer" sub="Lyra, Kael und dein Wolf">
      <View style={s.key}>
        <Image source={IMG.keyArt[w.index]} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Lyra, Kael, Ylva und dein Wolf im Zauberwald" />
      </View>

      {!premium ? (
        <Card style={{ borderColor: C.gold }}>
          <H2>Die ganze Welt mit Premium</H2>
          <P dim>Mit Premium wächst dein Wolf in fünf Stufen, Lyra und Kael bekommen neue Kleidung, du sammelst magische Gegenstände und baust dein Refugium aus. Dein Fortschritt zählt schon jetzt mit.</P>
          <Button title="Zu den Einstellungen" kind="ghost" icon="cog-outline" onPress={() => router.push('/einstellungen')} />
        </Card>
      ) : null}

      <Grid cols={tablet ? 2 : 1}>
        <Card style={{ flex: 1, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={s.heroPic}>
            {outfitImg ? (
              <Image source={outfitImg} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel={heroName + ' im Outfit ' + outfit.name} />
            ) : (
              <>
                <Image source={hero === 'lyra' ? IMG.lyra : IMG.kael} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} contentFit="contain" />
                <PlaceholderNote text="Bild folgt" />
              </>
            )}
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.heroName}>{heroName}</Text>
            <H2>Level {lv.level}</H2>
            <Bar value={(xp - lv.from) / (lv.to - lv.from)} />
            <P dim>{xp} XP · nächstes Level bei {lv.to} XP</P>
            {premium ? (
              <>
                <Text style={[s.rarity, { color: RARITY_COLOR[outfit.rarity] }]}>{outfit.name} · {RARITY_NAME[outfit.rarity]}</Text>
                <Pressable onPress={() => router.push('/sammlung?view=outfits')} accessibilityRole="button" style={s.link}>
                  <Text style={s.linkText}>Kleidung wechseln</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </Card>

        <Card style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Image source={IMG.wolfSit[w.index]} style={{ width: tablet ? 130 : 100, height: tablet ? 160 : 124 }} contentFit="contain" accessibilityLabel={w.stage.name} />
          <View style={{ flex: 1, gap: 6 }}>
            <H2>{w.stage.name}</H2>
            <P>Aktive Tage: {w.activeDays}</P>
            {!premium ? <P dim>Mit Premium wächst dein Wolf weiter.</P> : w.next ? <P dim>Noch {w.toNext} aktive Tage bis zum {w.next.dat}.</P> : <P dim>Dein Wolf hat die höchste Stufe erreicht.</P>}
            <Bar value={w.next ? (w.activeDays - w.stage.days) / (w.next.days - w.stage.days) : 1} color={C.lavender} height={12} />
          </View>
        </Card>
      </Grid>

      {premium ? (
        <Card>
          <H2>Wer begleitet dich gerade?</H2>
          <View style={{ flexDirection: 'row', gap: 14, justifyContent: 'center' }}>
            {(['lyra', 'kael'] as const).map((h) => (
              <Pressable key={h} onPress={() => setHero(h)} accessibilityRole="radio" aria-checked={hero === h} accessibilityLabel={h === 'lyra' ? 'Lyra' : 'Kael'} style={[s.pick, hero === h && { borderColor: C.gold, backgroundColor: 'rgba(226,188,102,0.12)' }]}>
                <Image source={IMG.avatar[h]} style={{ width: tablet ? 110 : 84, height: tablet ? 110 : 84 }} contentFit="contain" />
                <Text style={s.pickName}>{h === 'lyra' ? 'Lyra' : 'Kael'}</Text>
              </Pressable>
            ))}
          </View>
          <P dim style={{ textAlign: 'center' }}>Beide wachsen mit deinem Fortschritt. Du kannst jederzeit wechseln.</P>
        </Card>
      ) : null}

      <H2>Die Gefährten</H2>
      <Grid cols={3} gap={10}>
        {[
          { img: IMG.lyra, name: 'Lyra', text: 'Neugierig, mutig, kreativ' },
          { img: IMG.kael, name: 'Kael', text: 'Entschlossen und treu' },
          { img: IMG.mentor, name: 'Ylva', text: 'Die Mentorin – deine weise Lehrerin' },
        ].map((c) => (
          <View key={c.name} style={s.char}>
            <Image source={c.img} style={{ width: '100%', height: tablet ? 300 : 170 }} contentFit="contain" accessibilityLabel={c.name} />
            <Text style={s.charName}>{c.name}</Text>
            <Text style={s.charText}>{c.text}</Text>
          </View>
        ))}
      </Grid>

      <Card>
        <H2>Die fünf Stufen des Wolfs</H2>
        <View style={s.stages}>
          {WOLF_STAGES.map((st, i) => (
            <View key={st.key} style={[s.stage, i > w.index && { opacity: 0.35 }]}>
              <Image source={IMG.wolfSit[i]} style={{ width: '100%', height: tablet ? 120 : 70 }} contentFit="contain" />
              <Text style={s.stageName}>{st.name}</Text>
              <Text style={s.stageDays}>{st.days ? `ab ${st.days} Tagen` : 'Start'}</Text>
              {i > 0 && !premium ? <Icon name="lock-outline" size={16} color={C.dim} /> : null}
            </View>
          ))}
        </View>
      </Card>
      <StoryLane lane="s" title="Lyra, Kael und Fenrir – Das Geheimnis der Waldhüter" intro="Jeden Tag öffnet sich ein neues Kapitel." label="Kapitel" />
    </Screen>
  );
}

/** Eine Spur der Geschichte: Kapitel mit ihren Tagesteilen. Das Kapitel mit dem neuesten Teil ist aufgeklappt, die anderen per Antippen. */
function StoryLane({ lane, title, intro, label }: { lane: Lane; title: string; intro: string; label: string }) {
  const { state, today, markStory, ready } = useStore();
  const { tablet } = useLayout();
  const list = lane === 'b' ? BACKSTORY : STORY_CHAPTERS;
  const imgs = lane === 'b' ? BACKSTORY_IMG : STORY_IMG;
  const missing = lane === 'b' ? BACKSTORY_IMG_MISSING : STORY_IMG_MISSING;
  const so = storyOpen(state, today, (ts) => dayKey(new Date(ts)));
  // Der heute neue Teil gilt als gelesen, sobald er zu sehen ist
  // erst nach dem Laden (sonst landet der Merker im leeren Anfangszustand und geht verloren)
  useEffect(() => {
    if (ready && so.next && so.next.lane === lane) markStory(so.next.id);
  }, [ready, so.next?.id, lane]);
  const read = state.story || {};
  // „Neu“ bleibt den ganzen Tag am Teil stehen, der heute dazukam
  const isNew = (id: string) => so.next?.id === id || (read[id] !== undefined && dayKey(new Date(read[id])) === today);
  // neuester offener Teil dieser Spur → sein Kapitel ist aufgeklappt
  let newest = -1, newestTs = -1;
  list.forEach((_, c) => list[c].parts.forEach((__, p) => { const id = partId(lane, c, p); const ts = id === so.next?.id ? Date.now() : read[id] ?? -1; if (ts > newestTs) { newestTs = ts; newest = c; } }));
  const [openCh, setOpenCh] = useState<Set<number>>(new Set());
  const chapters = list.map((x, c) => ({ x, c, opened: x.parts.map((_, p) => so.open.has(partId(lane, c, p))) })).filter((k) => k.opened.some(Boolean));
  const lastCh = chapters.length ? chapters[chapters.length - 1] : null;
  const nextLocked = (() => {
    // Was als Nächstes kommt: weiterer Teil (morgen) oder ein verschlossenes Kapitel
    if (lastCh && lastCh.opened.some((o) => !o)) return { text: lane === 'b' ? 'Morgen erzählt Ylva weiter.' : 'Morgen geht die Geschichte weiter.' };
    const c = lastCh ? lastCh.c + 1 : 0;
    if (c >= list.length) return lane === 's' ? { text: 'Die nächsten Kapitel sind bald da.' } : null;
    if (ruleMet(state, list[c].rule, today)) return { text: lane === 'b' ? 'Morgen erzählt Ylva weiter.' : 'Morgen geht die Geschichte weiter.' };
    return { text: `${label} ${c + 1}: Noch verschlossen – ${ruleText(list[c].rule)}.` };
  })();
  return (
    <>
      <H2>{title}</H2>
      <P dim>{intro}</P>
      {chapters.map(({ x, c, opened }) => {
        const expanded = openCh.has(c) !== (c === newest);
        const n = x.parts.length;
        return (
          <Card key={lane + c} style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
            <Pressable onPress={() => setOpenCh((o) => { const s2 = new Set(o); if (s2.has(c)) s2.delete(c); else s2.add(c); return s2; })} accessibilityRole="button" aria-expanded={expanded} accessibilityLabel={`${label} ${c + 1}: ${x.title}`}>
              <Image source={imgs[c]} style={{ width: '100%', aspectRatio: expanded ? 16 / 9 : 32 / 9 }} contentFit="cover" />
              <View style={{ padding: 14, paddingBottom: expanded ? 4 : 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[s.charName, { flex: 1, textAlign: 'left' }]}>{`${label} ${c + 1}: ${x.title}`}</Text>
                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} color={C.dim} />
              </View>
            </Pressable>
            {expanded ? (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10, maxWidth: tablet ? 760 : undefined }}>
                {missing[c] ? <PlaceholderNote text="Übergang – eigenes Bild folgt" /> : null}
                {x.parts.map((pt, p) => opened[p] ? (
                  <View key={p} style={{ gap: 8 }}>
                    {n > 1 ? <Text style={s.partHead}>{`Teil ${p + 1} von ${n}${isNew(partId(lane, c, p)) ? ' · Neu' : ''}`}</Text> : isNew(partId(lane, c, p)) ? <Text style={s.partHead}>Neu</Text> : null}
                    {pt.map((para, i) => {
                      const pics = lane === 's' && p === 0 ? (STORY_INLINE[c] || []).filter((q) => q.after === i) : [];
                      return (
                        <View key={i} style={{ gap: 10 }}>
                          <P>{para}</P>
                          {pics.map((q, k) => <Image key={k} source={q.img} style={s.storyPic} contentFit="cover" accessibilityLabel="Bild zur Geschichte" />)}
                        </View>
                      );
                    })}
                  </View>
                ) : null)}
              </View>
            ) : null}
          </Card>
        );
      })}
      {nextLocked ? (
        <View style={s.locked}>
          <Icon name="lock-outline" color={C.dim} />
          <P dim style={{ flex: 1 }}>{nextLocked.text}</P>
        </View>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  key: { width: '100%', aspectRatio: 3 / 2, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.goldDim, backgroundColor: C.card },
  heroPic: { width: 110, height: 190, alignItems: 'center', justifyContent: 'flex-end' },
  heroName: { fontFamily: F.title, fontSize: 24, color: C.gold },
  rarity: { fontFamily: F.bold, fontSize: 14 },
  link: { paddingVertical: 4 },
  linkText: { fontFamily: F.bold, fontSize: 15, color: C.gold, textDecorationLine: 'underline' },
  pick: { alignItems: 'center', gap: 6, padding: 10, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  pickName: { fontFamily: F.title, fontSize: 17, color: C.text },
  char: { flex: 1, alignItems: 'center', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, paddingVertical: 10, paddingHorizontal: 6, gap: 2 },
  charName: { fontFamily: F.title, fontSize: 16, color: C.gold, textAlign: 'center' },
  charText: { fontFamily: F.text, fontSize: 13, color: C.dim, textAlign: 'center' },
  stages: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  stage: { flex: 1, alignItems: 'center', gap: 2 },
  stageName: { fontFamily: F.bold, fontSize: 13, color: C.text, textAlign: 'center' },
  storyPic: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, marginVertical: 6 },
  partHead: { fontFamily: F.bold, fontSize: 13, color: C.gold, letterSpacing: 0.5 },
  locked: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6, paddingVertical: 4 },
  stageDays: { fontFamily: F.text, fontSize: 12, color: C.dim, textAlign: 'center' },
});
