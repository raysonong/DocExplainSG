import { useTranslation } from 'react-i18next';

import { NATIVE_NAMES, SUPPORTED_LANGUAGES } from '../i18n';
import { useLanguage } from '../store/language';
import { Segmented } from './ui/segmented';

/** Persistent language selector — pills in each language's own script. */
export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <Segmented
      pill
      label={t('home.chooseLanguage')}
      value={language}
      onChange={setLanguage}
      options={SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: NATIVE_NAMES[l] }))}
    />
  );
}
