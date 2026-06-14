import { useRouter } from 'expo-router';
import { Camera, FileText, Image as ImageIcon, Lock, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Animated, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageSelector } from '../components/LanguageSelector';
import { ModeSelector } from '../components/ModeSelector';
import { Text } from '../components/ui/text';
import { pickPdf, pickPhotos, takePhoto } from '../lib/pickers';
import { useAnalysis } from '../store/analysis';
import { useLanguage } from '../store/language';
import type { SelectedFile } from '../types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { addFiles, clearFiles } = useAnalysis();

  // Fade the tagline in when the language changes.
  const opacity = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);
  const firstRender = useRef(true);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reduceMotion.current = v;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      reduceMotion.current = v;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (reduceMotion.current) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [language, opacity]);

  const handlePress = async (action: 'camera' | 'gallery' | 'pdf') => {
    let files: SelectedFile[] = [];
    if (action === 'camera') files = await takePhoto();
    else if (action === 'gallery') files = await pickPhotos();
    else files = await pickPdf();

    if (files.length === 0) return;
    clearFiles();
    addFiles(files);
    router.push('/review');
  };

  return (
    <ScrollView
      className="flex-1 bg-black"
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 16,
      }}
    >
      <View className="w-full max-w-[480px] gap-5 self-center rounded-3xl border border-border bg-[#0d0d10] p-5">
        <LanguageSelector />

        <View className="items-center gap-1">
          <Text className="text-center text-3xl font-extrabold text-brand">
            DocExplainSG
          </Text>
          <Animated.View style={{ opacity }}>
            <Text
              accessibilityLabel={t('home.tagline')}
              accessibilityLiveRegion="polite"
              className="text-center text-base text-foreground"
            >
              {t('home.tagline')}
            </Text>
          </Animated.View>
        </View>

        <View className="gap-2">
          <Text className="text-sm text-muted-foreground">{t('home.iWantTo')}</Text>
          <ModeSelector />
        </View>

        <View className="gap-2">
          <Text className="text-sm text-muted-foreground">{t('home.uploadDocument')}</Text>
          <View className="gap-3">
            <CaptureButton
              Icon={Camera}
              label={t('home.takePhoto')}
              onPress={() => handlePress('camera')}
            />
            <CaptureButton
              Icon={ImageIcon}
              label={t('home.choosePhoto')}
              onPress={() => handlePress('gallery')}
            />
            <CaptureButton
              Icon={FileText}
              label={t('home.choosePdf')}
              onPress={() => handlePress('pdf')}
            />
          </View>
        </View>

        <View className="flex-row items-start justify-center gap-2 px-2">
          <Lock color="#A1A1AA" size={14} style={{ marginTop: 2 }} />
          <Text className="flex-1 text-center text-xs leading-5 text-muted-foreground">
            {t('home.privacyNote')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function CaptureButton({
  Icon,
  label,
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center gap-4 rounded-2xl bg-secondary px-4 py-4 active:opacity-80"
    >
      <View className="h-10 w-10 items-center justify-center rounded-lg bg-[#3f3f46]">
        <Icon color="#FAFAFA" size={22} />
      </View>
      <Text className="text-lg font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}
