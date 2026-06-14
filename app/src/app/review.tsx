import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, analyzeDocument } from '../lib/api';
import { pickPdf, pickPhotos, takePhoto } from '../lib/pickers';
import { useAnalysis } from '../store/analysis';
import { useLanguage } from '../store/language';
import { MIN_TOUCH, colors, fontSize, radius, spacing } from '../theme/theme';
import type { SelectedFile } from '../types';

/**
 * Review screen: confirm the pages, add or remove, then "Explain this".
 */
export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { files, addFiles, removeFile, setResult } = useAnalysis();

  const mutation = useMutation({
    mutationFn: () => analyzeDocument(files, language),
    onSuccess: (result) => {
      setResult(result);
      router.replace('/result');
    },
  });

  const addMore = async (kind: 'camera' | 'gallery' | 'pdf') => {
    let picked: SelectedFile[] = [];
    if (kind === 'camera') picked = await takePhoto();
    else if (kind === 'gallery') picked = await pickPhotos();
    else picked = await pickPdf();
    if (picked.length) addFiles(picked);
  };

  const busy = mutation.isPending;

  if (busy) {
    return (
      <View style={styles.center} accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.busyText}>{t('review.reading')}</Text>
        <Text style={styles.busySub}>{t('review.readingSub')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <Text style={styles.heading}>
        {t(files.length === 1 ? 'review.page' : 'review.pages', {
          count: files.length,
        })}
      </Text>

      <View style={styles.grid}>
        {files.map((file) => (
          <View key={file.uri} style={styles.thumbWrap}>
            {file.isPdf ? (
              <View style={[styles.thumb, styles.pdfThumb]}>
                <Text style={styles.pdfIcon}>📄</Text>
                <Text numberOfLines={2} style={styles.pdfName}>
                  {file.name}
                </Text>
              </View>
            ) : (
              <Image source={{ uri: file.uri }} style={styles.thumb} />
            )}
            <Pressable
              onPress={() => removeFile(file.uri)}
              accessibilityRole="button"
              accessibilityLabel={t('review.remove', { name: file.name })}
              style={styles.removeBtn}
            >
              <Text style={styles.removeIcon}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.addRow}>
        <AddChip label={`📷 ${t('review.addCamera')}`} onPress={() => addMore('camera')} />
        <AddChip label={`🖼️ ${t('review.addGallery')}`} onPress={() => addMore('gallery')} />
        <AddChip label={`📄 ${t('review.addPdf')}`} onPress={() => addMore('pdf')} />
      </View>

      {mutation.isError && (
        <View style={styles.errorBox} accessibilityLiveRegion="assertive">
          <Text style={styles.errorText}>{errorMessage(mutation.error, t)}</Text>
        </View>
      )}

      <Pressable
        onPress={() => mutation.mutate()}
        disabled={files.length === 0}
        accessibilityRole="button"
        accessibilityLabel={t('review.explain')}
        style={({ pressed }) => [
          styles.primary,
          files.length === 0 && styles.primaryDisabled,
          pressed && styles.primaryPressed,
        ]}
      >
        <Text style={styles.primaryLabel}>{t('review.explain')}</Text>
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        style={styles.secondary}
      >
        <Text style={styles.secondaryLabel}>{t('review.cancel')}</Text>
      </Pressable>
    </ScrollView>
  );
}

/** Localised, user-safe error text for the analyze failure. */
function errorMessage(
  error: unknown,
  t: (key: string) => string,
): string {
  if (error instanceof ApiError) {
    // No HTTP status => never reached the server (network/connection issue).
    if (error.status === undefined) return t('review.errorNetwork');
    // Server sent a (already friendly) detail message.
    return error.message;
  }
  return t('review.errorGeneric');
}

function AddChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
    >
      <Text style={styles.chipLabel}>{label}</Text>
    </Pressable>
  );
}

const THUMB = 140;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  busyText: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  busySub: { fontSize: fontSize.body, color: colors.textMuted },
  heading: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  thumbWrap: { position: 'relative' },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pdfThumb: { alignItems: 'center', justifyContent: 'center', padding: spacing.sm },
  pdfIcon: { fontSize: 40 },
  pdfName: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.urgentFg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: { color: '#fff', fontWeight: '800', fontSize: 16 },
  addRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  chipPressed: { opacity: 0.7 },
  chipLabel: { fontSize: fontSize.body, fontWeight: '700', color: colors.primaryDark },
  errorBox: {
    backgroundColor: colors.urgentBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.urgentFg,
  },
  errorText: { color: colors.urgentFg, fontSize: fontSize.body },
  primary: {
    minHeight: MIN_TOUCH + 12,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  primaryDisabled: { backgroundColor: colors.border },
  primaryPressed: { opacity: 0.85 },
  primaryLabel: { color: colors.onPrimary, fontSize: fontSize.title, fontWeight: '800' },
  secondary: { alignItems: 'center', paddingVertical: spacing.md },
  secondaryLabel: { color: colors.textMuted, fontSize: fontSize.body },
});
