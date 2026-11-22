import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { StoreProvider } from '../lib/store';
import { colors, isDark } from '../lib/theme';

export default function RootLayout() {
  // Erst im Browser zeichnen: Farben (hell/dunkel) und Daten gibt es nur auf dem Gerät, nicht auf dem Server.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <StoreProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.card },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ presentation: 'modal', title: 'Lebensmittel hinzufügen' }} />
        <Stack.Screen name="edit" options={{ presentation: 'modal', title: 'Eintrag bearbeiten' }} />
      </Stack>
    </StoreProvider>
  );
}
