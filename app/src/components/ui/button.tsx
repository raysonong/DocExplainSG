import { cva, type VariantProps } from 'class-variance-authority';
import { Pressable } from 'react-native';

import { cn } from '../../lib/utils';
import { TextClassContext } from './text';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-lg active:opacity-90 disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        outline: 'border border-border bg-transparent',
        destructive: 'bg-destructive',
        ghost: 'bg-transparent',
      },
      size: {
        // min-h ensures >=48dp touch targets (accessibility)
        default: 'min-h-[52px] px-5 py-3',
        lg: 'min-h-[60px] px-6 py-4',
        sm: 'min-h-[44px] px-4 py-2',
        pill: 'min-h-[48px] px-4 py-2 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

const buttonTextVariants = cva('text-base font-semibold text-center', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      destructive: 'text-destructive-foreground',
      ghost: 'text-primary-strong',
    },
    size: { default: '', lg: 'text-lg', sm: 'text-sm', pill: '' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export type ButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariants> & { textClass?: string };

export function Button({
  className,
  variant,
  size,
  textClass,
  children,
  ...props
}: ButtonProps) {
  return (
    <TextClassContext.Provider
      value={cn(buttonTextVariants({ variant, size }), textClass)}
    >
      <Pressable
        accessibilityRole="button"
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { buttonTextVariants, buttonVariants };
