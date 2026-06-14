import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Collapsible } from '../components/Collapsible';
import { askQuestion } from '../lib/api';
import { useAnalysis } from '../store/analysis';
import { useLanguage } from '../store/language';
import { MIN_TOUCH, colors, fontSize, radius, spacing } from '../theme/theme';

/**
 * Generic summary screen — renders a GenericSummary (title, summary, key points)
 * for the "summarize any document" mode. Supports the same grounded Q&A.
 */
export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { summary, reset } = useAnalysis();
  const [question, setQuestion] = useState('');

  const context = useMemo(
    () => (summary ? JSON.stringify(summary) : ''),
    [summary],
  );

  const askMutation = useMutation({
    mutationFn: (q: string) => askQuestion(context, q, language),
  });

  const startOver = () => {
    reset();
    // Pop back to the existing Home at the root rather than stacking a new one.
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/');
  };

  if (!summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.body}>{t('result.noExplanation')}</Text>
        <Pressable onPress={startOver} style={styles.primary}>
          <Text style={styles.primaryLabel}>{t('result.startOver')}</Text>
        </Pressable>
      </View>
    );
  }

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
      <Text style={styles.title} accessibilityRole="header">
        {summary.title}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('result.summary')}</Text>
        <Text style={styles.summary}>{summary.summary}</Text>
      </View>

      {summary.key_points.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('result.keyPoints')}</Text>
          {summary.key_points.map((p, i) => (
            <View key={i} style={styles.pointRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.pointText}>{p}</Text>
            </View>
          ))}
        </View>
      )}

      {summary.confidence_notes && (
        <Collapsible title={t('result.notes')}>
          <Text style={styles.body}>{summary.confidence_notes}</Text>
        </Collapsible>
      )}

      {/* Follow-up Q&A — grounded in this summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ask.title')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('ask.placeholder')}
          placeholderTextColor={colors.textMuted}
          value={question}
          onChangeText={setQuestion}
          multiline
          accessibilityLabel={t('ask.title')}
        />
        <Pressable
          onPress={() => askMutation.mutate(question.trim())}
          disabled={question.trim().length === 0 || askMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel={t('ask.send')}
          style={({ pressed }) => [
            styles.askBtn,
            (question.trim().length === 0 || askMutation.isPending) &&
              styles.primaryDisabled,
            pressed && styles.primaryPressed,
          ]}
        >
          {askMutation.isPending ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.askBtnLabel}>{t('ask.send')}</Text>
          )}
        </Pressable>
        {askMutation.isError && (
          <Text style={styles.askError}>{t('ask.error')}</Text>
        )}
        {askMutation.data && (
          <View style={styles.answerBox} accessibilityLiveRegion="polite">
            <Text style={styles.answerText}>{askMutation.data}</Text>
          </View>
        )}
      </View>

      <Text style={styles.disclaimer}>{summary.disclaimer}</Text>

      <Pressable
        onPress={startOver}
        accessibilityRole="button"
        accessibilityLabel={t('result.startOver')}
        style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
      >
        <Text style={styles.primaryLabel}>{t('result.startOver')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: { fontSize: fontSize.heading, fontWeight: '800', color: colors.text },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.title, fontWeight: '800', color: colors.text },
  summary: { fontSize: fontSize.body, color: colors.text, lineHeight: fontSize.body * 1.5 },
  pointRow: { flexDirection: 'row', gap: spacing.sm },
  bullet: { fontSize: fontSize.body, color: colors.primaryDark, fontWeight: '800' },
  pointText: { flex: 1, fontSize: fontSize.body, color: colors.text, lineHeight: fontSize.body * 1.4 },
  body: { fontSize: fontSize.body, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
    minHeight: MIN_TOUCH + 16,
    textAlignVertical: 'top',
  },
  askBtn: {
    minHeight: MIN_TOUCH,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  askBtnLabel: { color: colors.onPrimary, fontSize: fontSize.body, fontWeight: '800' },
  primaryDisabled: { backgroundColor: colors.border },
  askError: { color: colors.urgentFg, fontSize: fontSize.body },
  answerBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  answerText: { fontSize: fontSize.body, color: colors.text, lineHeight: fontSize.body * 1.5 },
  disclaimer: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: fontSize.caption * 1.5,
    marginTop: spacing.sm,
  },
  primary: {
    minHeight: MIN_TOUCH + 12,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  primaryPressed: { opacity: 0.85 },
  primaryLabel: { color: colors.onPrimary, fontSize: fontSize.title, fontWeight: '800' },
});
