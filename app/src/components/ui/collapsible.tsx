import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '../../lib/utils';
import { Text } from './text';

/** Accessible expand/collapse section (shadcn-style, NativeWind). */
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
    <View className="overflow-hidden rounded-md border border-border">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        className="min-h-[48px] flex-row items-center justify-between bg-card px-4 py-3 active:opacity-80"
      >
        <Text className="flex-shrink text-base font-bold text-foreground">
          {title}
          {count !== undefined ? `  (${count})` : ''}
        </Text>
        <Text className="ml-2 text-base text-muted-foreground">
          {open ? '▲' : '▼'}
        </Text>
      </Pressable>
      {open && <View className={cn('gap-2 p-4')}>{children}</View>}
    </View>
  );
}
