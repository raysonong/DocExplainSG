import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PrivacyNotice } from '../components/PrivacyNotice';
import '../lib/applyFont'; // apply Helvetica app-wide (side effect)
import '../i18n'; // initialise i18next (side effect)
import { AnalysisProvider } from '../store/analysis';
import { LanguageProvider } from '../store/language';
import { colors } from '../theme/theme';

const queryClient = new QueryClient();

/**
 * Root layout. Wraps every screen in the providers we need (gesture handling,
 * safe areas, React Query, and the shared analysis store). The Stack header is
 * hidden — each screen provides its own heading and back/start-over controls.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AnalysisProvider>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                }}
              />
              <PrivacyNotice />
            </AnalysisProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
