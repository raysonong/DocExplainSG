import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NATIVE_NAMES, SUPPORTED_LANGUAGES } from '../i18n';
import { useLanguage } from '../store/language';
import { MIN_TOUCH, colors, fontSize, radius, spacing } from '../theme/theme';

/**
 * Persistent language selector: a row of pills in each language's own script.
 * Selecting one switches the UI and the AI output language at once.
 */
export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <View
      style={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('home.chooseLanguage')}
    >
      {SUPPORTED_LANGUAGES.map((lang) => {
        const active = lang === language;
        return (
          <Pressable
            key={lang}
            onPress={() => setLanguage(lang)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={NATIVE_NAMES[lang]}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {NATIVE_NAMES[lang]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  pill: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.onPrimary,
  },
});
