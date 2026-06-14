import { cva, type VariantProps } from 'class-variance-authority';
import { View } from 'react-native';

import { cn } from '../../lib/utils';
import { TextClassContext } from './text';

const alertVariants = cva('flex-row items-center gap-3 rounded-md p-4', {
  variants: {
    variant: {
      info: 'bg-secondary',
      destructive: 'bg-destructive/20',
      warning: 'bg-warning/20',
      success: 'bg-success/20',
    },
  },
  defaultVariants: { variant: 'info' },
});

const alertTextClass: Record<string, string> = {
  info: 'text-primary-strong',
  destructive: 'text-destructive',
  warning: 'text-warning',
  success: 'text-success',
};

export function Alert({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<typeof View> & VariantProps<typeof alertVariants>) {
  return (
    <TextClassContext.Provider value={alertTextClass[variant ?? 'info']}>
      <View className={cn(alertVariants({ variant }), className)} {...props}>
        {children}
      </View>
    </TextClassContext.Provider>
  );
}
