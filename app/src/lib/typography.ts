/**
 * App typography: Inter for Latin scripts, with correct static-weight mapping,
 * and a system-font fallback for Chinese/Tamil so they never render as tofu.
 *
 * Why a render patch instead of a Tailwind base font:
 * - expo-google-fonts registers each Inter weight as a SEPARATE family
 *   (Inter_700Bold, …). A single `font-sans` family can't express weights, and
 *   forcing one family makes bold text look wrong. Here we read each Text's
 *   resolved fontWeight and pick the matching Inter family.
 * - Inter has no CJK/Tamil glyphs. On Android a custom family would tofu, so for
 *   zh/ta we inject NO family and let the system font (which has those glyphs)
 *   render. Malay (ms) is Latin, so it uses Inter.
 */

import { StyleSheet, Text, TextInput } from 'react-native';

import type { AppLanguage } from '../types';

// Inter font families to load (see _layout useFonts).
export const INTER_FONTS = {
  Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  Inter_500Medium: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  Inter_600SemiBold: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  Inter_700Bold: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  Inter_800ExtraBold: require('@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf'),
};

const WEIGHT_TO_FAMILY: Record<string, string> = {
  '100': 'Inter_400Regular',
  '200': 'Inter_400Regular',
  '300': 'Inter_400Regular',
  '400': 'Inter_400Regular',
  normal: 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  bold: 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
  '900': 'Inter_800ExtraBold',
};

// Latin-script locales use Inter; others fall back to the system font.
const LATIN_LOCALES = new Set<AppLanguage>(['en', 'ms']);
let activeLanguage: AppLanguage = 'en';

export function setFontLanguage(language: AppLanguage): void {
  activeLanguage = language;
}

function interFamilyFor(style: unknown): string | undefined {
  if (!LATIN_LOCALES.has(activeLanguage)) return undefined; // system font (CJK/Tamil)
  const flat = StyleSheet.flatten(style as never) as { fontWeight?: unknown } | undefined;
  const weight = flat?.fontWeight != null ? String(flat.fontWeight) : '400';
  return WEIGHT_TO_FAMILY[weight] ?? 'Inter_400Regular';
}

/** Patch Text/TextInput once so every text node gets the right font family. */
export function installTypography(): void {
  for (const Component of [Text, TextInput] as unknown[]) {
    const comp = Component as {
      render?: (...a: unknown[]) => unknown;
      __interPatched?: boolean;
    };
    if (!comp.render || comp.__interPatched) continue;
    comp.__interPatched = true;
    const original = comp.render;
    comp.render = function patched(...args: unknown[]) {
      const element = original.apply(this, args) as {
        props?: { style?: unknown };
      } | null;
      if (!element || typeof element !== 'object' || !('props' in element)) {
        return element;
      }
      const family = interFamilyFor(element.props?.style);
      if (!family) return element; // leave system font for non-Latin scripts
      const React = require('react') as typeof import('react');
      return React.cloneElement(element as never, {
        style: [{ fontFamily: family }, element.props?.style],
      } as never);
    };
  }
}
