/**
 * Apply a single font family across the whole app.
 *
 * React Native has no global font setting, and our screens pass their own
 * `style` objects (which would override a `Text.defaultProps` default). So we
 * patch the `render` of `Text`/`TextInput` (both are forwardRef objects that
 * expose `.render`) to PREPEND the font family — component styles still win for
 * anything they set (size, weight), and we only fill in the family they omit.
 *
 * Helvetica resolves natively on iOS/macOS; on Android and Windows it falls
 * back to the platform sans-serif. On web we pass a proper CSS fallback stack.
 */

import { cloneElement, isValidElement } from 'react';
import { Platform, Text, TextInput } from 'react-native';

const FONT_FAMILY =
  Platform.OS === 'web' ? 'Helvetica, Arial, sans-serif' : 'Helvetica';

function patchFont(Component: unknown): void {
  const comp = Component as { render?: (...args: unknown[]) => unknown; __fontPatched?: boolean };
  if (!comp.render || comp.__fontPatched) return;
  comp.__fontPatched = true;
  const original = comp.render;
  comp.render = function patched(...args: unknown[]) {
    const element = original.apply(this, args);
    if (!isValidElement(element)) return element;
    const prev = (element.props as { style?: unknown }).style;
    return cloneElement(element as never, {
      style: [{ fontFamily: FONT_FAMILY }, prev],
    } as never);
  };
}

patchFont(Text);
patchFont(TextInput);
