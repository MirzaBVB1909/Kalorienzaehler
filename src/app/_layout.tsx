import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { StoreProvider } from '../lib/store';
import { colors, isDark } from '../lib/theme';

export default function RootLayout() {
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
