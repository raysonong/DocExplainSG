/**
 * Central design tokens for DocExplainSG.
 *
 * Accessibility-first: large default type, high-contrast colours, and
 * generous spacing so touch targets comfortably exceed 48dp. Urgency is
 * always conveyed by icon + text + colour, never colour alone (see §9).
 */

export const colors = {
  // Dark theme (default). Tuned for high contrast on a dark background.
  // Brand / primary action
  primary: '#3B82F6', // blue-500 — for filled buttons (with white text)
  primaryDark: '#93C5FD', // blue-300 — for text/labels on dark surfaces
  onPrimary: '#FFFFFF',

  // Surfaces (dark)
  background: '#0F172A', // slate-900
  surface: '#1E293B', // slate-800
  surfaceAlt: '#1E3A5F', // muted dark blue for chips / secondary buttons

  // Text — high contrast on dark
  text: '#F1F5F9', // slate-100
  textMuted: '#94A3B8', // slate-400
  border: '#334155', // slate-700

  // Urgency palette (paired with icons + labels elsewhere)
  urgentBg: '#2A0E0E',
  urgentFg: '#EF4444',
  warnBg: '#2A1E06',
  warnFg: '#F59E0B',
  okBg: '#052E2B',
  okFg: '#34D399',
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
