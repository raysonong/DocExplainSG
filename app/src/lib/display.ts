/**
 * Presentation helpers for result data.
 *
 * Returns an i18n key + the shadcn Alert variant + a lucide icon for each
 * urgency level. Urgency is always conveyed by icon + text + colour (never
 * colour alone) for accessibility.
 */

import { AlertTriangle, Bell, CheckCircle2, Info, type LucideIcon } from 'lucide-react-native';

import type { Urgency } from '../types';

export interface UrgencyPresentation {
  labelKey: string;
  variant: 'destructive' | 'warning' | 'info' | 'success';
  Icon: LucideIcon;
  iconColor: string;
}

export function urgencyPresentation(urgency: Urgency): UrgencyPresentation {
  switch (urgency) {
    case 'high':
      return { labelKey: 'urgency.high', variant: 'destructive', Icon: AlertTriangle, iconColor: '#EF4444' };
    case 'medium':
      return { labelKey: 'urgency.medium', variant: 'warning', Icon: Bell, iconColor: '#F59E0B' };
    case 'low':
      return { labelKey: 'urgency.low', variant: 'info', Icon: Info, iconColor: '#FAFAFA' };
    case 'none':
    default:
      return { labelKey: 'urgency.none', variant: 'success', Icon: CheckCircle2, iconColor: '#22C55E' };
  }
}
