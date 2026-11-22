import { Tabs } from 'expo-router';
import { Icon } from '../../ui/kit';
import { C, F } from '../../ui/theme';

const TABS = [
  { name: 'index', title: 'Heute', icon: 'white-balance-sunny' },
  { name: 'abenteuer', title: 'Abenteuer', icon: 'compass-outline' },
  { name: 'refugium', title: 'Refugium', icon: 'home-variant-outline' },
  { name: 'tagebuch', title: 'Tagebuch', icon: 'book-open-page-variant-outline' },
  { name: 'sammlung', title: 'Sammlung', icon: 'trophy-outline' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.dim,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: 'rgba(226,188,102,0.35)', minHeight: 62 },
        tabBarLabelStyle: { fontFamily: F.bold, fontSize: 12 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color }) => <Icon name={t.icon} size={26} color={String(color)} /> }} />
      ))}
    </Tabs>
  );
}
