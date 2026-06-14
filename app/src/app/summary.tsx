import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/ui/button';
import { Collapsible } from '../components/ui/collapsible';
import { Textarea } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { askQuestion } from '../lib/api';
import { useAnalysis } from '../store/analysis';
import { useLanguage } from '../store/language';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-xl font-bold text-foreground">{title}</Text>
      <View className="gap-2">{children}</View>
    </View>
  );
}

export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { summary, reset } = useAnalysis();
  const [question, setQuestion] = useState('');

  const context = useMemo(() => (summary ? JSON.stringify(summary) : ''), [summary]);
  const askMutation = useMutation({
    mutationFn: (q: string) => askQuestion(context, q, language),
  });

  const startOver = () => {
    reset();
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/');
  };

  if (!summary) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-black px-6">
        <Text className="text-base text-foreground">{t('result.noExplanation')}</Text>
        <Button onPress={startOver}>
          <Text className="text-lg font-bold text-primary-foreground">
            {t('result.startOver')}
          </Text>
        </Button>
      </View>
    );
  }

  const askDisabled = question.trim().length === 0 || askMutation.isPending;

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
      <View className="w-full max-w-[640px] gap-5 self-center rounded-3xl border border-border bg-[#0d0d10] p-5">
        <Text accessibilityRole="header" className="text-2xl font-extrabold text-foreground">
          {summary.title}
        </Text>

        <Section title={t('result.summary')}>
          <Text className="text-base leading-6 text-foreground">{summary.summary}</Text>
        </Section>

        {summary.key_points.length > 0 && (
          <Section title={t('result.keyPoints')}>
            {summary.key_points.map((p, i) => (
              <View key={i} className="flex-row gap-2">
                <Text className="text-base font-bold text-primary-strong">•</Text>
                <Text className="flex-1 text-base leading-6 text-foreground">{p}</Text>
              </View>
            ))}
          </Section>
        )}

        {summary.confidence_notes && (
          <Collapsible title={t('result.notes')}>
            <Text className="text-base text-foreground">{summary.confidence_notes}</Text>
          </Collapsible>
        )}

        {/* Follow-up Q&A */}
        <Section title={t('ask.title')}>
          <Textarea
            placeholder={t('ask.placeholder')}
            value={question}
            onChangeText={setQuestion}
            accessibilityLabel={t('ask.title')}
          />
          <Button
            size="sm"
            disabled={askDisabled}
            className={askDisabled ? 'opacity-50' : undefined}
            accessibilityLabel={t('ask.send')}
            onPress={() => askMutation.mutate(question.trim())}
          >
            {askMutation.isPending ? (
              <ActivityIndicator color="#18181B" />
            ) : (
              <Text className="font-bold text-primary-foreground">{t('ask.send')}</Text>
            )}
          </Button>
          {askMutation.isError && (
            <Text className="text-base text-destructive">{t('ask.error')}</Text>
          )}
          {askMutation.data && (
            <View className="rounded-md bg-secondary p-4" accessibilityLiveRegion="polite">
              <Text className="text-base leading-6 text-foreground">{askMutation.data}</Text>
            </View>
          )}
        </Section>

        <Text className="mt-1 text-xs italic leading-5 text-muted-foreground">
          {summary.disclaimer}
        </Text>

        <Button size="lg" accessibilityLabel={t('result.startOver')} onPress={startOver}>
          <Text className="text-lg font-bold text-primary-foreground">
            {t('result.startOver')}
          </Text>
        </Button>
      </View>
    </ScrollView>
  );
}
