import { useRouter } from 'expo-router';
import { Camera, FileText, Image as ImageIcon, Lock, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageSelector } from '../components/LanguageSelector';
import { ModeSelector } from '../components/ModeSelector';
import { Text } from '../components/ui/text';
import { pickPdf, pickPhotos, takePhoto } from '../lib/pickers';
import { useAnalysis } from '../store/analysis';
import type { SelectedFile } from '../types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { addFiles, clearFiles } = useAnalysis();

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
          <Text className="text-center text-base text-foreground">
            {t('home.tagline')}
          </Text>
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
