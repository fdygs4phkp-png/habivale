import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccountProvider } from '../state/account';
import { StoreProvider } from '../state/store';
import { C } from '../ui/theme';

export default function RootLayout() {
  // Im Browser erst nach dem Start zeichnen: die vorgefertigte Seite (ohne Bildschirmgröße und gespeicherte Daten)
  // würde sonst nicht zur echten passen (React-Fehler 418 beim Neuladen einer Unterseite).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [loaded, error] = useFonts({
    Cinzel: require('../../assets/fonts/Cinzel.ttf'),
    Atkinson: require('../../assets/fonts/AtkinsonHyperlegible-Regular.ttf'),
    AtkinsonBold: require('../../assets/fonts/AtkinsonHyperlegible-Bold.ttf'),
  });
  if (!mounted || (!loaded && !error)) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <AccountProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="habit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="geld" />
          <Stack.Screen name="einstellungen" />
          <Stack.Screen name="konto" />
          <Stack.Screen name="familie" />
          <Stack.Screen name="verbinden" />
        </Stack>
        </AccountProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
