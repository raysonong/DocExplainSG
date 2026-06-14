import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../i18n'; // initialise i18next (side effect)
import { AnalysisProvider } from '../store/analysis';
import { LanguageProvider } from '../store/language';
import { colors } from '../theme/theme';

const queryClient = new QueryClient();

/**
 * Root layout. Wraps every screen in the providers we need (gesture handling,
 * safe areas, React Query, and the shared analysis store) and defines the
 * navigation stack.
 */
function Navigation() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'DocExplainSG' }} />
      <Stack.Screen name="review" options={{ title: t('title.review') }} />
      <Stack.Screen name="result" options={{ title: t('title.result') }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AnalysisProvider>
              <StatusBar style="dark" />
              <Navigation />
            </AnalysisProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
