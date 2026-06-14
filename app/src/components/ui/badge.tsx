import { cva, type VariantProps } from 'class-variance-authority';
import { View } from 'react-native';

import { cn } from '../../lib/utils';
import { Text } from './text';

const badgeVariants = cva('self-start rounded-full px-3 py-1', {
  variants: {
    variant: {
      default: 'bg-secondary',
      outline: 'border border-border',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function Badge({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<typeof View> & VariantProps<typeof badgeVariants>) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      <Text className="text-xs font-bold text-secondary-foreground">
        {children}
      </Text>
    </View>
  );
}
