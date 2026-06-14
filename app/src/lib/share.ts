/** Build a printable summary and share it as a PDF. */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { AnalysisResult } from '../types';
import { urgencyPresentation } from './display';

type TFunc = (key: string, opts?: Record<string, unknown>) => string;

export class ShareUnavailableError extends Error {}

function esc(s: string): string {
  return s.replace(
    /[&<>]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string,
  );
}

/** Compose a clean, localized HTML summary of the result for printing. */
export function buildSummaryHtml(r: AnalysisResult, t: TFunc): string {
  const section = (title: string, inner: string) =>
    inner ? `<h2>${esc(title)}</h2>${inner}` : '';

  const deadlines = r.deadlines
    .map(
      (d) =>
        `<li><strong>${esc(d.date)}</strong>${
          d.is_urgent ? ` (${esc(t('urgency.high'))})` : ''
        } — ${esc(d.description)}</li>`,
    )
    .join('');

  const actions = r.actions
    .map((a) => {
      const linked =
        a.linked_deadline_index != null
          ? r.deadlines[a.linked_deadline_index]
          : undefined;
      const meta = [
        a.amount ? esc(t('result.amount', { amount: a.amount })) : '',
        linked ? esc(t('result.by', { date: linked.date })) : '',
      ]
        .filter(Boolean)
        .join(' · ');
      return `<li>${esc(a.description)}${meta ? `<br><small>${meta}</small>` : ''}</li>`;
    })
    .join('');

  const refs = r.reference_numbers
    .map((x) => `<li>${esc(x.label)}: <strong>${esc(x.value)}</strong></li>`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, "Noto Sans", "Noto Sans Tamil", "Noto Sans CJK SC", sans-serif; padding: 24px; color: #111827; line-height: 1.5; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 20px 0 6px; color: #1E3A8A; }
  .muted { color: #4B5563; }
  .chip { display: inline-block; background: #E6F0FF; color: #1E3A8A; border-radius: 999px; padding: 2px 10px; font-size: 12px; }
  ul { margin: 4px 0; padding-left: 20px; }
  .disclaimer { margin-top: 24px; font-size: 12px; color: #4B5563; font-style: italic; }
</style></head><body>
  <div class="chip">${esc(t(`docType.${r.document_type}`))}</div>
  <h1>${esc(r.title)}</h1>
  <div class="muted">${esc(t('result.from', { issuer: r.issuer }))}</div>
  <div class="muted">${esc(t(urgencyPresentation(r.urgency).labelKey))}</div>
  ${section(t('result.summary'), `<p>${esc(r.summary)}</p>`)}
  ${section(t('result.deadlines'), deadlines ? `<ul>${deadlines}</ul>` : '')}
  ${section(t('result.actions'), actions ? `<ul>${actions}</ul>` : '')}
  ${section(t('result.referenceNumbers'), refs ? `<ul>${refs}</ul>` : '')}
  <div class="disclaimer">${esc(r.disclaimer)}</div>
</body></html>`;
}

export async function shareSummaryPdf(r: AnalysisResult, t: TFunc): Promise<void> {
  const html = buildSummaryHtml(r, t);
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) {
    throw new ShareUnavailableError();
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: r.title,
  });
}
