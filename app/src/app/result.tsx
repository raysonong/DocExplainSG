import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { urgencyPresentation } from '../lib/display';
import { ShareUnavailableError, shareSummaryPdf } from '../lib/share';
import { useAnalysis } from '../store/analysis';
import { useLanguage } from '../store/language';
import { MIN_TOUCH, colors, fontSize, radius, spacing } from '../theme/theme';

/**
 * Result screen: leads with urgency, deadlines, and required actions; tucks
 * secondary detail into collapsibles; pins the disclaimer at the bottom.
 */
export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { result, files, reset } = useAnalysis();
  const [question, setQuestion] = useState('');

  // The grounding context for follow-up questions is the result itself.
  const context = useMemo(
    () => (result ? JSON.stringify(result) : ''),
    [result],
  );

  const askMutation = useMutation({
    mutationFn: (q: string) => askQuestion(context, q, language),
  });

  const onShare = async () => {
    if (!result) return;
    try {
      await shareSummaryPdf(result, t);
    } catch (err) {
      Alert.alert(
        '',
        err instanceof ShareUnavailableError
          ? t('share.unavailable')
          : t('share.error'),
      );
    }
  };

  const startOver = () => {
    reset();
    // Pop back to the existing Home at the root rather than stacking a new one
    // (which would leave a phantom "back" entry).
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/');
  };

  if (!result) {
    return (
      <View style={styles.center}>
        <Text style={styles.body}>{t('result.noExplanation')}</Text>
        <Pressable onPress={startOver} style={styles.primary}>
          <Text style={styles.primaryLabel}>{t('result.startOver')}</Text>
        </Pressable>
      </View>
    );
  }

  const urgency = urgencyPresentation(result.urgency);
  const imageFiles = files.filter((f) => !f.isPdf);

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
      {/* Header: title + issuer + type */}
      <View style={styles.headerBlock}>
        <View style={styles.typeChip}>
          <Text style={styles.typeChipText}>
            {t(`docType.${result.document_type}`)}
          </Text>
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {result.title}
        </Text>
        <Text style={styles.issuer}>
          {t('result.from', { issuer: result.issuer })}
        </Text>
      </View>

      {/* Urgency banner — icon + text + colour (read as one element) */}
      <View
        style={[styles.banner, { backgroundColor: urgency.bg }]}
        accessible
        accessibilityLabel={t('result.status', { label: t(urgency.labelKey) })}
      >
        <Text style={styles.bannerIcon} importantForAccessibility="no">
          {urgency.icon}
        </Text>
        <Text style={[styles.bannerText, { color: urgency.fg }]}>
          {t(urgency.labelKey)}
        </Text>
      </View>

      {/* Deadlines */}
      {result.deadlines.length > 0 && (
        <Section title={t('result.deadlines')}>
          {result.deadlines.map((d, i) => (
            <View
              key={`${d.date}-${i}`}
              style={[styles.deadlineRow, d.is_urgent && styles.deadlineUrgent]}
              accessible
              accessibilityLabel={`${d.is_urgent ? t('urgency.high') + '. ' : ''}${d.date}. ${d.description}`}
            >
              <Text style={styles.deadlineIcon} importantForAccessibility="no">
                {d.is_urgent ? '⚠️' : '📅'}
              </Text>
              <View style={styles.flex1}>
                <Text style={styles.deadlineDate}>{d.date}</Text>
                <Text style={styles.deadlineDesc}>{d.description}</Text>
              </View>
            </View>
          ))}
        </Section>
      )}

      {/* Required actions */}
      {result.actions.length > 0 && (
        <Section title={t('result.actions')}>
          {result.actions.map((a, i) => {
            const linked =
              a.linked_deadline_index != null
                ? result.deadlines[a.linked_deadline_index]
                : undefined;
            const meta = [
              a.amount ? t('result.amount', { amount: a.amount }) : '',
              linked ? t('result.by', { date: linked.date }) : '',
            ].filter(Boolean);
            return (
              <View
                key={i}
                style={styles.actionRow}
                accessible
                accessibilityLabel={[a.description, ...meta].join('. ')}
              >
                <Text style={styles.actionBullet} importantForAccessibility="no">
                  ☐
                </Text>
                <View style={styles.flex1}>
                  <Text style={styles.actionText}>{a.description}</Text>
                  {meta.length > 0 && (
                    <Text style={styles.actionMeta}>{meta.join('   ·   ')}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </Section>
      )}

      {/* Summary */}
      <Section title={t('result.summary')}>
        <Text style={styles.summary}>{result.summary}</Text>
      </Section>

      {/* Secondary detail */}
      {result.reference_numbers.length > 0 && (
        <Collapsible
          title={t('result.referenceNumbers')}
          count={result.reference_numbers.length}
        >
          {result.reference_numbers.map((r, i) => (
            <View key={i} style={styles.refRow}>
              <Text style={styles.refLabel}>{r.label}</Text>
              <Text selectable style={styles.refValue}>
                {r.value}
              </Text>
            </View>
          ))}
        </Collapsible>
      )}

      {result.glossary.length > 0 && (
        <Collapsible title={t('result.glossary')} count={result.glossary.length}>
          {result.glossary.map((g, i) => (
            <View key={i} style={styles.glossItem}>
              <Text style={styles.glossTerm}>{g.term}</Text>
              <Text style={styles.glossText}>{g.explanation}</Text>
            </View>
          ))}
        </Collapsible>
      )}

      {imageFiles.length > 0 && (
        <Collapsible title={t('result.yourDocument')} count={imageFiles.length}>
          <View style={styles.docGrid}>
            {imageFiles.map((f) => (
              <Image key={f.uri} source={{ uri: f.uri }} style={styles.docThumb} />
            ))}
          </View>
        </Collapsible>
      )}

      {result.confidence_notes && (
        <Collapsible title={t('result.notes')}>
          <Text style={styles.body}>{result.confidence_notes}</Text>
        </Collapsible>
      )}

      {/* Follow-up Q&A — grounded in this result */}
      <Section title={t('ask.title')}>
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
      </Section>

      {/* Disclaimer pinned near the bottom */}
      <Text style={styles.disclaimer}>{result.disclaimer}</Text>

      <Pressable
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel={t('share.button')}
        style={({ pressed }) => [styles.shareBtn, pressed && styles.primaryPressed]}
      >
        <Text style={styles.shareBtnLabel}>{t('share.button')}</Text>
      </Pressable>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
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
  flex1: { flex: 1 },
  headerBlock: { gap: spacing.sm },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  typeChipText: { color: colors.primaryDark, fontWeight: '700', fontSize: fontSize.caption },
  title: { fontSize: fontSize.heading, fontWeight: '800', color: colors.text },
  issuer: { fontSize: fontSize.body, color: colors.textMuted },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bannerIcon: { fontSize: fontSize.heading },
  bannerText: { fontSize: fontSize.title, fontWeight: '800', flexShrink: 1 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.title, fontWeight: '800', color: colors.text },
  sectionBody: { gap: spacing.sm },
  deadlineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  deadlineUrgent: { backgroundColor: colors.urgentBg, borderWidth: 1, borderColor: colors.urgentFg },
  deadlineIcon: { fontSize: fontSize.title },
  deadlineDate: { fontSize: fontSize.body, fontWeight: '800', color: colors.text },
  deadlineDesc: { fontSize: fontSize.body, color: colors.text },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  actionBullet: { fontSize: fontSize.title, color: colors.primaryDark },
  actionText: { fontSize: fontSize.body, color: colors.text, fontWeight: '600' },
  actionMeta: { fontSize: fontSize.caption, color: colors.textMuted, marginTop: spacing.xs },
  summary: { fontSize: fontSize.body, color: colors.text, lineHeight: fontSize.body * 1.5 },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  refLabel: { fontSize: fontSize.body, color: colors.textMuted, flexShrink: 1 },
  refValue: { fontSize: fontSize.body, color: colors.text, fontWeight: '700' },
  glossItem: { gap: 2 },
  glossTerm: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  glossText: { fontSize: fontSize.body, color: colors.textMuted, lineHeight: fontSize.body * 1.4 },
  docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  docThumb: {
    width: 100,
    height: 100,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  body: { fontSize: fontSize.body, color: colors.text },
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
  answerBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  answerText: { fontSize: fontSize.body, color: colors.text, lineHeight: fontSize.body * 1.5 },
  shareBtn: {
    minHeight: MIN_TOUCH + 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  shareBtnLabel: { color: colors.primaryDark, fontSize: fontSize.title, fontWeight: '800' },
});
