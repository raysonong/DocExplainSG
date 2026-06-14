import { useFonts } from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../../global.css'; // NativeWind (Tailwind) styles
import { PrivacyNotice } from '../components/PrivacyNotice';
import '../i18n'; // initialise i18next (side effect)
import { INTER_FONTS, installTypography } from '../lib/typography';
import { AnalysisProvider } from '../store/analysis';
import { LanguageProvider } from '../store/language';

// Apply Inter (with weight + script-aware fallback) to every Text/TextInput.
installTypography();
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Root layout. Loads Inter, then wraps every screen in the providers we need
 * (gesture handling, safe areas, React Query, language + analysis stores). The
 * Stack header is hidden — each screen provides its own heading/controls.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts(INTER_FONTS);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
                  contentStyle: { backgroundColor: '#09090B' },
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
