/**
 * Presentation helpers for result data.
 *
 * Returns i18n keys (resolved with `t()` in components) plus the icon + colours.
 * Urgency is always paired with an icon + label (never colour alone) for
 * accessibility.
 */

import { colors } from '../theme/theme';
import type { Urgency } from '../types';

export interface UrgencyPresentation {
  /** i18n key under `urgency.*`. */
  labelKey: string;
  icon: string; // emoji as an icon, paired with text + colour
  fg: string;
  bg: string;
}

export function urgencyPresentation(urgency: Urgency): UrgencyPresentation {
  switch (urgency) {
    case 'high':
      return { labelKey: 'urgency.high', icon: '⚠️', fg: colors.urgentFg, bg: colors.urgentBg };
    case 'medium':
      return { labelKey: 'urgency.medium', icon: '🔔', fg: colors.warnFg, bg: colors.warnBg };
    case 'low':
      return { labelKey: 'urgency.low', icon: 'ℹ️', fg: colors.primaryDark, bg: colors.surfaceAlt };
    case 'none':
    default:
      return { labelKey: 'urgency.none', icon: '✅', fg: colors.okFg, bg: colors.okBg };
  }
}
