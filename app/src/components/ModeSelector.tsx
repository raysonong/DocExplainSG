import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAnalysis } from '../store/analysis';
import { MIN_TOUCH, colors, fontSize, radius, spacing } from '../theme/theme';
import type { AnalysisMode } from '../types';

/**
 * Choose what to do with the upload: explain an official letter (the structured
 * pipeline) or summarize any document (the generic pipeline).
 */
const MODES: { mode: AnalysisMode; key: string }[] = [
  { mode: 'analyze', key: 'mode.explain' },
  { mode: 'summarize', key: 'mode.summarize' },
];

export function ModeSelector() {
  const { t } = useTranslation();
  const { mode, setMode } = useAnalysis();

  return (
    <View
      style={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('mode.label')}
    >
      {MODES.map((m) => {
        const active = m.mode === mode;
        return (
          <Pressable
            key={m.mode}
            onPress={() => setMode(m.mode)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(m.key)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {t(m.key)}
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
    gap: spacing.sm,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  pill: {
    flex: 1,
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.primaryDark,
  },
});
