/**
 * Central design tokens for DocExplainSG.
 *
 * Accessibility-first: large default type, high-contrast colours, and
 * generous spacing so touch targets comfortably exceed 48dp. Urgency is
 * always conveyed by icon + text + colour, never colour alone (see §9).
 */

export const colors = {
  // Brand / primary action
  primary: '#1A56DB', // accessible blue (AA on white)
  primaryDark: '#1E3A8A',
  onPrimary: '#FFFFFF',

  // Surfaces
  background: '#FFFFFF',
  surface: '#F3F4F6',
  surfaceAlt: '#E6F0FF',

  // Text — high contrast on white
  text: '#111827',
  textMuted: '#4B5563',
  border: '#D1D5DB',

  // Urgency palette (paired with icons + labels elsewhere)
  urgentBg: '#FEF2F2',
  urgentFg: '#B91C1C',
  warnBg: '#FFFBEB',
  warnFg: '#B45309',
  okBg: '#ECFDF5',
  okFg: '#047857',
} as const;

/** Base spacing scale (multiples of 4). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Type scale. Intentionally large defaults for low-literacy / elderly users.
 * The OS font-scaling setting multiplies these further (allowFontScaling
 * stays on by default).
 */
export const fontSize = {
  caption: 14,
  body: 18,
  title: 22,
  heading: 28,
  display: 34,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Minimum interactive target size (dp). */
export const MIN_TOUCH = 48;
