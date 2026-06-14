import { useTranslation } from 'react-i18next';

import { useAnalysis } from '../store/analysis';
import type { AnalysisMode } from '../types';
import { Select } from './ui/select';

/**
 * Dropdown to choose what to do with the upload. Each option describes what it
 * does: explain an official letter (deadlines + actions) vs summarize any
 * document (plain-language overview).
 */
export function ModeSelector() {
  const { t } = useTranslation();
  const { mode, setMode } = useAnalysis();

  return (
    <Select<AnalysisMode>
      accessibilityLabel={t('mode.label')}
      value={mode}
      onChange={setMode}
      options={[
        { value: 'analyze', label: t('mode.explain'), description: t('mode.explainHint') },
        { value: 'summarize', label: t('mode.summarize'), description: t('mode.summarizeHint') },
      ]}
    />
  );
}
