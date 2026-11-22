import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../state/store';
import { C } from '../ui/theme';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Cinzel: require('../../assets/fonts/Cinzel.ttf'),
    Atkinson: require('../../assets/fonts/AtkinsonHyperlegible-Regular.ttf'),
    AtkinsonBold: require('../../assets/fonts/AtkinsonHyperlegible-Bold.ttf'),
  });
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="habit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="geld" />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
