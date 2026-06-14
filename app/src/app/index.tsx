import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageSelector } from '../components/LanguageSelector';
import { ModeSelector } from '../components/ModeSelector';
import { pickPdf, pickPhotos, takePhoto } from '../lib/pickers';
import { useAnalysis } from '../store/analysis';
import { useLanguage } from '../store/language';
import { MIN_TOUCH, colors, fontSize, radius, spacing } from '../theme/theme';
import type { SelectedFile } from '../types';

/**
 * Home / Capture screen. Pick a language, then capture or upload a document.
 */

type Action = 'camera' | 'gallery' | 'pdf';

const BUTTONS: { action: Action; emoji: string; key: string }[] = [
  { action: 'camera', emoji: '📷', key: 'home.takePhoto' },
  { action: 'gallery', emoji: '🖼️', key: 'home.choosePhoto' },
  { action: 'pdf', emoji: '📄', key: 'home.choosePdf' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { addFiles, clearFiles } = useAnalysis();

  // Smoothly fade the tagline in whenever the language changes.
  const opacity = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);
  const firstRender = useRef(true);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reduceMotion.current = v;
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (v) => {
        reduceMotion.current = v;
      },
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (reduceMotion.current) return;
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, [language, opacity]);

  const handlePress = async (action: Action) => {
    let files: SelectedFile[] = [];
    if (action === 'camera') files = await takePhoto();
    else if (action === 'gallery') files = await pickPhotos();
    else files = await pickPdf();

    if (files.length === 0) return; // cancelled or denied

    clearFiles();
    addFiles(files);
    router.push('/review');
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <LanguageSelector />

      <View style={styles.hero}>
        <Text style={styles.brand} accessibilityRole="header">
          DocExplainSG
        </Text>
        <Animated.Text
          style={[styles.tagline, { opacity }]}
          accessibilityLabel={t('home.tagline')}
          accessibilityLiveRegion="polite"
        >
          {t('home.tagline')}
        </Animated.Text>
      </View>

      {/* Spacer pushes the actions + privacy note down to the bottom. */}
      <View style={styles.spacer} />

      <ModeSelector />

      <View style={styles.actions}>
        {BUTTONS.map((b) => (
          <Pressable
            key={b.action}
            onPress={() => handlePress(b.action)}
            accessibilityRole="button"
            accessibilityLabel={t(b.key)}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonEmoji}>{b.emoji}</Text>
            <Text style={styles.buttonLabel}>{t(b.key)}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.note}>{t('home.privacyNote')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    marginTop: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: spacing.lg,
  },
  brand: {
    fontSize: fontSize.display,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: fontSize.title,
    color: colors.text,
    textAlign: 'center',
    minHeight: fontSize.title * 2.4,
  },
  actions: {
    gap: spacing.md,
    // Keep buttons a comfortable width on wide screens (web / tablet).
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  button: {
    minHeight: MIN_TOUCH + 24,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  buttonPressed: {
    backgroundColor: colors.surface,
    opacity: 0.85,
  },
  buttonEmoji: {
    fontSize: fontSize.heading,
  },
  buttonLabel: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.primaryDark,
    // Wrap (don't overflow) for long translations / large font scales.
    flexShrink: 1,
  },
  note: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: fontSize.caption * 1.5,
    maxWidth: 720,
    alignSelf: 'center',
  },
});
