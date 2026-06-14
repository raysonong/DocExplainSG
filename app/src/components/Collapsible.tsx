import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TOUCH, colors, fontSize, radius, spacing } from '../theme/theme';

/**
 * A simple accessible expand/collapse section. Used for secondary detail
 * (reference numbers, glossary, original document) so the Result screen leads
 * with what matters.
 */
export function Collapsible({
  title,
  count,
  initiallyOpen = false,
  children,
}: {
  title: string;
  count?: number;
  initiallyOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <Text style={styles.title}>
          {title}
          {count !== undefined ? `  (${count})` : ''}
        </Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  header: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  title: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, flexShrink: 1 },
  chevron: { fontSize: fontSize.body, color: colors.textMuted, marginLeft: spacing.sm },
  body: { padding: spacing.md, gap: spacing.sm },
});
