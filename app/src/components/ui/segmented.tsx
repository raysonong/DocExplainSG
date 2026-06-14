import { Pressable, View } from 'react-native';

import { cn } from '../../lib/utils';
import { Text } from './text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Single-select toggle group (shadcn ToggleGroup equivalent). `grow` makes
 * options share width equally (segmented control); `pill` rounds them fully.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  grow = false,
  pill = false,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  grow?: boolean;
  pill?: boolean;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className={cn('flex-row gap-2', pill ? 'flex-wrap justify-center' : '')}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            className={cn(
              'min-h-[48px] items-center justify-center border-2 px-4 py-2 active:opacity-80',
              pill ? 'rounded-full' : 'rounded-md',
              grow && 'flex-1',
              active
                ? pill
                  ? 'border-primary bg-primary'
                  : 'border-border bg-secondary'
                : 'border-border bg-background',
            )}
          >
            <Text
              className={cn(
                'text-base font-bold',
                active
                  ? pill
                    ? 'text-primary-foreground'
                    : 'text-foreground'
                  : pill
                    ? 'text-foreground'
                    : 'text-muted-foreground',
              )}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
