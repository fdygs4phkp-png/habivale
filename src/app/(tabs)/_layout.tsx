import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { NAV_IMG } from '../../ui/images';
import { Icon, useLayout } from '../../ui/kit';
import { C, F } from '../../ui/theme';
import { useMode } from '../../ui/mode';

const TABS = [
  { name: 'index', title: 'Heute', icon: 'white-balance-sunny' },
  { name: 'abenteuer', title: 'Abenteuer', icon: 'compass-outline' },
  { name: 'refugium', title: 'Refugium', icon: 'home-variant-outline' },
  { name: 'tagebuch', title: 'Tagebuch', icon: 'book-open-page-variant-outline' },
  { name: 'sammlung', title: 'Sammlung', icon: 'trophy-outline' },
];

export default function TabLayout() {
  const { k } = useMode();
  const { tablet } = useLayout();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.dim,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: 'rgba(226,188,102,0.35)', minHeight: 62 },
        tabBarLabelStyle: { fontFamily: F.bold, fontSize: 12 * (tablet ? k : 1) },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color, focused }) =>
              NAV_IMG[t.name] ? (
                <Image source={NAV_IMG[t.name]} style={{ width: 30, height: 30, opacity: focused ? 1 : 0.5 }} contentFit="contain" accessibilityElementsHidden />
              ) : (
                <Icon name={t.icon} size={26} color={String(color)} />
              ) }} />
      ))}
    </Tabs>
  );
}
