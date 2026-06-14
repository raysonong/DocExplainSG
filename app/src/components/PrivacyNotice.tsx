import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertTriangle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from './ui/button';
import { Text } from './ui/text';

const CONSENT_KEY = 'docexplainsg.consent';
// Bump when the notice's substance changes — that re-prompts existing users.
const CONSENT_VERSION = '1';

/**
 * First-run consent gate. Explains what happens to the user's document, then
 * requires an explicit tap-to-agree before anything can be uploaded. Consent
 * (version + ISO timestamp) is persisted; a version bump re-prompts. The modal
 * covers the app, so upload is blocked until consent is given.
 */
export function PrivacyNotice() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
    AsyncStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ version: CONSENT_VERSION, acceptedAt: new Date().toISOString() }),
    ).catch(() => {
      /* non-fatal: notice will show again next launch */
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={accept}>
      <View
        className="flex-1 bg-black px-6"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}
      >
        <ScrollView>
          <View className="gap-4 pb-4">
            <Text accessibilityRole="header" className="text-2xl font-extrabold text-foreground">
              {t('privacy.title')}
            </Text>
            <Text className="text-base leading-6 text-foreground">{t('privacy.p1')}</Text>
            <Text className="text-base leading-6 text-foreground">{t('privacy.p2')}</Text>
            <Text className="text-base leading-6 text-foreground">{t('privacy.p3')}</Text>

            <View className="mt-1 flex-row gap-3 rounded-md border border-warning bg-warning/20 p-4">
              <AlertTriangle color="#F59E0B" size={20} style={{ marginTop: 2 }} />
              <Text className="flex-1 text-base font-semibold leading-6 text-warning">
                {t('privacy.warning')}
              </Text>
            </View>
          </View>
        </ScrollView>

        <Text className="mt-3 text-center text-xs leading-5 text-muted-foreground">
          {t('privacy.consentLine')}
        </Text>
        <Button
          size="lg"
          className="mt-2"
          accessibilityLabel={t('privacy.accept')}
          onPress={accept}
        >
          <Text className="text-lg font-bold text-primary-foreground">
            {t('privacy.accept')}
          </Text>
        </Button>
      </View>
    </Modal>
  );
}
