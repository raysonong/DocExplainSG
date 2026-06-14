import { TextInput } from 'react-native';

import { cn } from '../../lib/utils';

/** Muted-foreground colour for placeholders (matches the theme token). */
export const PLACEHOLDER_COLOR = '#94A3B8';

export function Input({
  className,
  ...props
}: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={PLACEHOLDER_COLOR}
      className={cn(
        'rounded-md border border-input bg-card px-4 py-3 text-base text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<typeof TextInput>) {
  return (
    <Input
      multiline
      textAlignVertical="top"
      className={cn('min-h-[64px]', className)}
      {...props}
    />
  );
}
