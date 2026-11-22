import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dayKey, shortDateDe } from '../../logic/date.ts';
import { TROPHIES, type TrophyDef } from '../../logic/trophies.ts';
import { ITEMS, OUTFITS, RARITY_COLOR, RARITY_NAME, ruleText, unlockedItems, unlockedOutfits, type Hero } from '../../logic/world.ts';
import { useStore } from '../../state/store';
import { ITEM_IMG, OUTFIT_IMG, TROPHY_BORROWED, TROPHY_IMG } from '../../ui/images';
import { Button, Card, Chip, Grid, H2, Icon, P, PlaceholderNote, Screen, Sheet, useLayout } from '../../ui/kit';
import { C, F } from '../../ui/theme';

type View_ = 'trophies' | 'outfits' | 'items';

export default function Collection() {
  const params = useLocalSearchParams<{ view?: string }>();
  const { state, today, wearOutfit } = useStore();
  const { tablet, width } = useLayout();
  const [view, setView] = useState<View_>('trophies');
  const [open, setOpen] = useState<TrophyDef | null>(null);
  const [hero, setHero] = useState<Hero>(state.hero);
  useEffect(() => {
    if (params.view === 'outfits' || params.view === 'items') setView(params.view);
  }, [params.view]);

  const premium = state.premium;
  const visible = TROPHIES.filter((t) => premium || t.free || state.firsts['t:' + t.id] !== undefined);
  const got = visible.filter((t) => state.firsts['t:' + t.id] !== undefined).length;
  const cols = width >= 1000 ? 4 : tablet ? 3 : 2;
  const outfitsOk = unlockedOutfits(state, today);
  const itemsOk = unlockedItems(state, today);

  return (
    <Screen title="Sammlung" sub={view === 'trophies' ? `Trophäen: ${got} von ${visible.length}` : view === 'outfits' ? 'Kleidung für Lyra und Kael' : `Gegenstände: ${itemsOk.size} von ${ITEMS.length}`}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip title="Trophäen" on={view === 'trophies'} onPress={() => setView('trophies')} />
        <Chip title="Kleidung" on={view === 'outfits'} onPress={() => setView('outfits')} />
        <Chip title="Gegenstände" on={view === 'items'} onPress={() => setView('items')} />
      </View>

      {view === 'trophies' ? (
        <>
          <Grid cols={cols} gap={10}>
            {visible.map((t) => {
              const at = state.firsts['t:' + t.id];
              const yes = at !== undefined;
              return (
                <Pressable key={t.id} onPress={() => setOpen(t)} accessibilityRole="button" accessibilityLabel={t.name} style={[s.tile, yes && s.tileOn]}>
                  {TROPHY_IMG[t.id] ? <Image source={TROPHY_IMG[t.id]} style={[s.img, !yes && { opacity: 0.22 }]} contentFit="contain" /> : <Icon name={t.icon} size={40} color={yes ? C.gold : 'rgba(194,187,168,0.35)'} />}
                  <Text style={[s.name, !yes && { color: C.dim }]}>{t.name}</Text>
                  {yes ? <Text style={s.date}>{shortDateDe(dayKey(new Date(at)))}</Text> : <Text style={s.text}>{t.how}</Text>}
                </Pressable>
              );
            })}
          </Grid>
          {!premium ? <P dim>Mit Premium gibt es viele weitere Trophäen.</P> : null}
        </>
      ) : !premium ? (
        <Card style={{ borderColor: C.gold }}>
          <H2>Kleidung und Gegenstände</H2>
          <P dim>Mit Premium bekommen Lyra und Kael neue Kleidung, und ihr sammelt magische Gegenstände – alles verdient durch deinen Fortschritt, nie gekauft.</P>
        </Card>
      ) : view === 'outfits' ? (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip title="Lyra" on={hero === 'lyra'} onPress={() => setHero('lyra')} />
            <Chip title="Kael" on={hero === 'kael'} onPress={() => setHero('kael')} />
          </View>
          <Grid cols={tablet ? 3 : 2} gap={10}>
            {OUTFITS.filter((o) => o.hero === hero).map((o) => {
              const ok = outfitsOk.has(o.id);
              const worn = state.outfits[hero] === o.id;
              const img = OUTFIT_IMG[o.id];
              return (
                <View key={o.id} style={[s.tile, worn && s.tileOn, { minHeight: tablet ? 360 : 300 }]}>
                  <View style={{ width: '100%', height: tablet ? 220 : 170, alignItems: 'center', justifyContent: 'center' }}>
                    {img ? <Image source={img} style={[StyleSheet.absoluteFill, !ok && { opacity: 0.2 }]} contentFit="contain" /> : <><Icon name={ok ? 'hanger' : 'lock-outline'} size={44} color={ok ? RARITY_COLOR[o.rarity] : C.dim} /><PlaceholderNote text="Bild folgt" /></>}
                  </View>
                  <Text style={[s.name, !ok && { color: C.dim }]}>{o.name}</Text>
                  <Text style={[s.rar, { color: RARITY_COLOR[o.rarity] }]}>{RARITY_NAME[o.rarity]}</Text>
                  {ok ? (
                    worn ? <Text style={s.date}>Trägt {hero === 'lyra' ? 'Lyra' : 'Kael'} gerade</Text> : <Button title="Anziehen" kind="ghost" onPress={() => wearOutfit(hero, o.id)} />
                  ) : (
                    <Text style={s.text}>{ruleText(o.rule)}</Text>
                  )}
                </View>
              );
            })}
          </Grid>
        </>
      ) : (
        <>
          <Grid cols={cols} gap={10}>
            {ITEMS.map((it) => {
              const ok = itemsOk.has(it.id);
              return (
                <View key={it.id} style={[s.tile, ok && { borderColor: RARITY_COLOR[it.rarity] }]}>
                  {ITEM_IMG[it.id] ? <Image source={ITEM_IMG[it.id]} style={[s.img, !ok && { opacity: 0.18 }]} contentFit="contain" /> : <Icon name={ok ? it.icon : 'lock-outline'} size={44} color={ok ? RARITY_COLOR[it.rarity] : 'rgba(194,187,168,0.35)'} />}
                  <Text style={[s.name, !ok && { color: C.dim }]}>{it.name}</Text>
                  <Text style={[s.rar, { color: RARITY_COLOR[it.rarity] }]}>{RARITY_NAME[it.rarity]}</Text>
                  <Text style={s.text}>{ok ? it.text : ruleText(it.rule)}</Text>
                </View>
              );
            })}
          </Grid>
        </>
      )}

      <Sheet visible={!!open} onClose={() => setOpen(null)} title={open?.name ?? ''}>
        {open ? (
          <View style={{ alignItems: 'center', gap: 12 }}>
            {TROPHY_IMG[open.id] ? <Image source={TROPHY_IMG[open.id]} style={[{ width: 220, height: 220 }, state.firsts['t:' + open.id] === undefined && { opacity: 0.25 }]} contentFit="contain" /> : null}
            <P style={{ textAlign: 'center' }}>{state.firsts['t:' + open.id] !== undefined ? open.text : 'So bekommst du sie: ' + open.how}</P>
            {state.firsts['t:' + open.id] !== undefined ? <P dim>Erreicht am {shortDateDe(dayKey(new Date(state.firsts['t:' + open.id])))}</P> : null}
            {TROPHY_BORROWED.has(open.id) ? <PlaceholderNote text="Bild vorerst aus der Lebensrad-App geliehen" /> : null}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  tile: { flex: 1, minHeight: 190, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 12, alignItems: 'center', gap: 6 },
  tileOn: { borderColor: C.gold },
  img: { width: 104, height: 104 },
  name: { fontFamily: F.bold, fontSize: 15, color: C.text, textAlign: 'center' },
  rar: { fontFamily: F.bold, fontSize: 13 },
  text: { fontFamily: F.text, fontSize: 13, color: C.dim, textAlign: 'center' },
  date: { fontFamily: F.text, fontSize: 13, color: C.gold },
});
