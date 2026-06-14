import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CalendarClock, Share2, Square } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert as RNAlert, Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Collapsible } from '../components/ui/collapsible';
import { Textarea } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { askQuestion } from '../lib/api';
import { urgencyPresentation } from '../lib/display';
import { ShareUnavailableError, shareSummaryPdf } from '../lib/share';
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

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { result, files, reset } = useAnalysis();
  const [question, setQuestion] = useState('');

  const context = useMemo(() => (result ? JSON.stringify(result) : ''), [result]);
  const askMutation = useMutation({
    mutationFn: (q: string) => askQuestion(context, q, language),
  });

  const onShare = async () => {
    if (!result) return;
    try {
      await shareSummaryPdf(result, t);
    } catch (err) {
      RNAlert.alert(
        '',
        err instanceof ShareUnavailableError ? t('share.unavailable') : t('share.error'),
      );
    }
  };

  const startOver = () => {
    reset();
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/');
  };

  if (!result) {
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

  const urgency = urgencyPresentation(result.urgency);
  const UrgencyIcon = urgency.Icon;
  const imageFiles = files.filter((f) => !f.isPdf);
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
        {/* Header */}
        <View className="gap-2">
          <Badge>{t(`docType.${result.document_type}`)}</Badge>
          <Text accessibilityRole="header" className="text-2xl font-extrabold text-foreground">
            {result.title}
          </Text>
          <Text className="text-base text-muted-foreground">
            {t('result.from', { issuer: result.issuer })}
          </Text>
        </View>

        {/* Urgency banner — icon + text + colour */}
        <Alert
          variant={urgency.variant}
          accessible
          accessibilityLabel={t('result.status', { label: t(urgency.labelKey) })}
        >
          <UrgencyIcon color={urgency.iconColor} size={22} />
          <Text className="flex-shrink text-lg font-extrabold">{t(urgency.labelKey)}</Text>
        </Alert>

        {/* Deadlines */}
        {result.deadlines.length > 0 && (
          <Section title={t('result.deadlines')}>
            {result.deadlines.map((d, i) => (
              <View
                key={`${d.date}-${i}`}
                accessible
                accessibilityLabel={`${d.is_urgent ? t('urgency.high') + '. ' : ''}${d.date}. ${d.description}`}
                className={
                  d.is_urgent
                    ? 'flex-row gap-3 rounded-md border border-destructive bg-destructive/20 p-4'
                    : 'flex-row gap-3 rounded-md bg-secondary p-4'
                }
              >
                <CalendarClock
                  color={d.is_urgent ? '#EF4444' : '#A1A1AA'}
                  size={22}
                  style={{ marginTop: 2 }}
                />
                <View className="flex-1">
                  <Text className="text-base font-extrabold text-foreground">{d.date}</Text>
                  <Text className="text-base text-foreground">{d.description}</Text>
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
                  accessible
                  accessibilityLabel={[a.description, ...meta].join('. ')}
                  className="flex-row gap-3 rounded-md bg-secondary p-4"
                >
                  <Square color="#A1A1AA" size={20} style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {a.description}
                    </Text>
                    {meta.length > 0 && (
                      <Text className="mt-1 text-xs text-muted-foreground">
                        {meta.join('   ·   ')}
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
          <Text className="text-base leading-6 text-foreground">{result.summary}</Text>
        </Section>

        {/* Secondary detail */}
        {result.reference_numbers.length > 0 && (
          <Collapsible title={t('result.referenceNumbers')} count={result.reference_numbers.length}>
            {result.reference_numbers.map((r, i) => (
              <View key={i} className="flex-row justify-between gap-3">
                <Text className="flex-shrink text-base text-muted-foreground">{r.label}</Text>
                <Text selectable className="text-base font-bold text-foreground">
                  {r.value}
                </Text>
              </View>
            ))}
          </Collapsible>
        )}

        {result.glossary.length > 0 && (
          <Collapsible title={t('result.glossary')} count={result.glossary.length}>
            {result.glossary.map((g, i) => (
              <View key={i} className="gap-0.5">
                <Text className="text-base font-bold text-foreground">{g.term}</Text>
                <Text className="text-base leading-6 text-muted-foreground">{g.explanation}</Text>
              </View>
            ))}
          </Collapsible>
        )}

        {imageFiles.length > 0 && (
          <Collapsible title={t('result.yourDocument')} count={imageFiles.length}>
            <View className="flex-row flex-wrap gap-2">
              {imageFiles.map((f) => (
                <Image
                  key={f.uri}
                  source={{ uri: f.uri }}
                  className="h-[100px] w-[100px] rounded-sm bg-secondary"
                />
              ))}
            </View>
          </Collapsible>
        )}

        {result.confidence_notes && (
          <Collapsible title={t('result.notes')}>
            <Text className="text-base text-foreground">{result.confidence_notes}</Text>
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

        {/* Disclaimer */}
        <Text className="mt-1 text-xs italic leading-5 text-muted-foreground">
          {result.disclaimer}
        </Text>

        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          accessibilityLabel={t('share.button')}
          onPress={onShare}
        >
          <Share2 color="#FAFAFA" size={20} />
          <Text className="text-base font-bold text-foreground">{t('share.button')}</Text>
        </Button>

        <Button size="lg" accessibilityLabel={t('result.startOver')} onPress={startOver}>
          <Text className="text-lg font-bold text-primary-foreground">
            {t('result.startOver')}
          </Text>
        </Button>
      </View>
    </ScrollView>
  );
}
