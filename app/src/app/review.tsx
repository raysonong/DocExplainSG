import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Camera, FileText, Image as ImageIcon, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import { ApiError, analyzeDocument, summarizeDocument } from '../lib/api';
import { pickPdf, pickPhotos, takePhoto } from '../lib/pickers';
import { useAnalysis } from '../store/analysis';
import { useLanguage } from '../store/language';
import type { SelectedFile } from '../types';

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { files, addFiles, removeFile, mode, setResult, setSummary } = useAnalysis();

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === 'summarize') {
        return { kind: 'summarize' as const, data: await summarizeDocument(files, language) };
      }
      return { kind: 'analyze' as const, data: await analyzeDocument(files, language) };
    },
    onSuccess: (out) => {
      if (out.kind === 'summarize') {
        setSummary(out.data);
        router.replace('/summary');
      } else {
        setResult(out.data);
        router.replace('/result');
      }
    },
  });

  const addMore = async (kind: 'camera' | 'gallery' | 'pdf') => {
    let picked: SelectedFile[] = [];
    if (kind === 'camera') picked = await takePhoto();
    else if (kind === 'gallery') picked = await pickPhotos();
    else picked = await pickPdf();
    if (picked.length) addFiles(picked);
  };

  if (mutation.isPending) {
    return (
      <View
        className="flex-1 items-center justify-center gap-3 bg-black px-6"
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator size="large" color="#FAFAFA" />
        <Text className="text-xl font-bold text-foreground">{t('review.reading')}</Text>
        <Text className="text-base text-muted-foreground">{t('review.readingSub')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-black"
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 16,
      }}
    >
      <View className="w-full max-w-[560px] gap-5 self-center rounded-3xl border border-border bg-[#0d0d10] p-5">
        <Text className="text-xl font-bold text-foreground">
          {t(files.length === 1 ? 'review.page' : 'review.pages', { count: files.length })}
        </Text>

        {files.length === 0 ? (
          <Text className="py-2 text-base leading-6 text-muted-foreground">
            {t('review.empty')}
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {files.map((file) => (
              <View key={file.uri} className="relative">
                {file.isPdf ? (
                  <View
                    className="h-[120px] w-[120px] items-center justify-center rounded-md border border-border bg-secondary p-2"
                    accessible
                    accessibilityLabel={file.name}
                  >
                    <FileText color="#A1A1AA" size={36} />
                    <Text numberOfLines={2} className="mt-1 text-center text-xs text-muted-foreground">
                      {file.name}
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: file.uri }}
                    className="h-[120px] w-[120px] rounded-md border border-border bg-secondary"
                    accessible
                    accessibilityLabel={file.name}
                  />
                )}
                <Pressable
                  onPress={() => removeFile(file.uri)}
                  accessibilityRole="button"
                  accessibilityLabel={t('review.remove', { name: file.name })}
                  className="absolute -right-2 -top-2 h-8 w-8 items-center justify-center rounded-full bg-destructive"
                >
                  <X color="#FFFFFF" size={16} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View className="flex-row flex-wrap gap-2">
          <Chip Icon={Camera} label={t('review.addCamera')} onPress={() => addMore('camera')} />
          <Chip Icon={ImageIcon} label={t('review.addGallery')} onPress={() => addMore('gallery')} />
          <Chip Icon={FileText} label={t('review.addPdf')} onPress={() => addMore('pdf')} />
        </View>

        {mutation.isError && (
          <View
            className="gap-3 rounded-md border border-destructive bg-destructive/20 p-4"
            accessibilityLiveRegion="assertive"
          >
            <Text className="text-base text-destructive">
              {errorMessage(mutation.error, t)}
            </Text>
            <Button
              variant="destructive"
              size="sm"
              className="self-start rounded-full"
              accessibilityLabel={t('review.retry')}
              onPress={() => mutation.mutate()}
            >
              <Text className="font-bold text-destructive-foreground">
                {t('review.retry')}
              </Text>
            </Button>
          </View>
        )}

        <Button
          size="lg"
          disabled={files.length === 0}
          accessibilityLabel={t('review.explain')}
          onPress={() => mutation.mutate()}
        >
          <Text className="text-lg font-bold text-primary-foreground">
            {t('review.explain')}
          </Text>
        </Button>

        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          className="items-center py-3 active:opacity-70"
        >
          <Text className="text-base text-muted-foreground">{t('review.cancel')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

type IconType = typeof Camera;

function Chip({
  Icon,
  label,
  onPress,
}: {
  Icon: IconType;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[44px] flex-row items-center gap-2 rounded-full border border-border bg-secondary px-4 active:opacity-80"
    >
      <Icon color="#D4D4D8" size={18} />
      <Text className="text-base font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}

/** Localised, user-safe error text for the analyze failure. */
function errorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.status === undefined) return t('review.errorNetwork');
    return error.message;
  }
  return t('review.errorGeneric');
}
