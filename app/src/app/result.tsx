import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Collapsible } from '../components/Collapsible';
import { urgencyPresentation } from '../lib/display';
import { useAnalysis } from '../store/analysis';
import { MIN_TOUCH, colors, fontSize, radius, spacing } from '../theme/theme';

/**
 * Result screen: leads with urgency, deadlines, and required actions; tucks
 * secondary detail into collapsibles; pins the disclaimer at the bottom.
 */
export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { result, files, reset } = useAnalysis();

  const startOver = () => {
    reset();
    router.replace('/');
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
        { paddingBottom: insets.bottom + spacing.xl },
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

      {/* Urgency banner — icon + text + colour */}
      <View
        style={[styles.banner, { backgroundColor: urgency.bg }]}
        accessibilityLabel={t('result.status', { label: t(urgency.labelKey) })}
      >
        <Text style={styles.bannerIcon}>{urgency.icon}</Text>
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
            >
              <Text style={styles.deadlineIcon}>{d.is_urgent ? '⚠️' : '📅'}</Text>
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
            return (
              <View key={i} style={styles.actionRow}>
                <Text style={styles.actionBullet}>☐</Text>
                <View style={styles.flex1}>
                  <Text style={styles.actionText}>{a.description}</Text>
                  {(a.amount || linked) && (
                    <Text style={styles.actionMeta}>
                      {a.amount ? t('result.amount', { amount: a.amount }) : ''}
                      {a.amount && linked ? '   ·   ' : ''}
                      {linked ? t('result.by', { date: linked.date }) : ''}
                    </Text>
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

      {/* Disclaimer pinned near the bottom */}
      <Text style={styles.disclaimer}>{result.disclaimer}</Text>

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
});
