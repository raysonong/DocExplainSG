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

const STORAGE_KEY = 'docexplainsg.privacyAccepted';

/**
 * First-run privacy notice. Shown once (until accepted), it explains in plain
 * language what happens to the user's document — including the free-tier
 * data-usage caveat — before they upload anything. Persisted via AsyncStorage.
 */
export function PrivacyNotice() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // Start hidden; only reveal if we confirm it hasn't been accepted, so it
  // never flashes for returning users.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v !== 'true') setVisible(true);
      })
      .catch(() => setVisible(true));
  }, []);

  const accept = () => {
    setVisible(false);
    AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {
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
  btn: {
    minHeight: MIN_TOUCH + 12,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  btnPressed: { opacity: 0.85 },
  btnLabel: {
    color: colors.onPrimary,
    fontSize: fontSize.title,
    fontWeight: '800',
  },
});
