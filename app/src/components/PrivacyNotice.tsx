import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MIN_TOUCH, colors, fontSize, radius, spacing } from '../theme/theme';

const CONSENT_KEY = 'docexplainsg.consent';
// Bump when the notice's substance changes — that re-prompts existing users.
const CONSENT_VERSION = '1';

/**
 * First-run consent gate. Explains in plain language what happens to the user's
 * document, then requires an explicit tap-to-agree before anything can be
 * uploaded. The recorded consent (version + ISO timestamp) is persisted via
 * AsyncStorage; a version bump re-prompts. The modal covers the app, so upload
 * is blocked until consent is given.
 */
export function PrivacyNotice() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // Start hidden; only reveal once we confirm consent is missing/outdated, so
  // it never flashes for users who have already agreed.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY)
      .then((raw) => {
        let current = false;
        if (raw) {
          try {
            current = JSON.parse(raw).version === CONSENT_VERSION;
          } catch {
            current = false;
          }
        }
        if (!current) setVisible(true);
      })
      .catch(() => setVisible(true));
  }, []);

  const accept = () => {
    setVisible(false);
    // Record what they consented to and when — for accountability (PDPA).
    AsyncStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        version: CONSENT_VERSION,
        acceptedAt: new Date().toISOString(),
      }),
    ).catch(() => {
      /* non-fatal: notice will show again next launch */
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={accept}>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title} accessibilityRole="header">
            {t('privacy.title')}
          </Text>
          <Text style={styles.p}>{t('privacy.p1')}</Text>
          <Text style={styles.p}>{t('privacy.p2')}</Text>
          <Text style={styles.p}>{t('privacy.p3')}</Text>
          <View style={styles.warnBox}>
            <Text style={styles.warnText}>
              <Text importantForAccessibility="no">⚠️ </Text>
              {t('privacy.warning')}
            </Text>
          </View>
        </ScrollView>

        <Text style={styles.consentLine}>{t('privacy.consentLine')}</Text>
        <Pressable
          onPress={accept}
          accessibilityRole="button"
          accessibilityLabel={t('privacy.accept')}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnLabel}>{t('privacy.accept')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  scroll: { gap: spacing.md, paddingBottom: spacing.lg },
  title: {
    fontSize: fontSize.heading,
    fontWeight: '800',
    color: colors.text,
  },
  p: {
    fontSize: fontSize.body,
    color: colors.text,
    lineHeight: fontSize.body * 1.5,
  },
  warnBox: {
    backgroundColor: colors.warnBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warnFg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  warnText: {
    fontSize: fontSize.body,
    color: colors.warnFg,
    lineHeight: fontSize.body * 1.5,
    fontWeight: '600',
  },
  consentLine: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: fontSize.caption * 1.5,
  },
  btn: {
    minHeight: MIN_TOUCH + 12,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  btnPressed: { opacity: 0.85 },
  btnLabel: {
    color: colors.onPrimary,
    fontSize: fontSize.title,
    fontWeight: '800',
  },
});
