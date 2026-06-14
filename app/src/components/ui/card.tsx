import { View } from 'react-native';

import { cn } from '../../lib/utils';
import { Text } from './text';

export function Card({ className, ...props }: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn('rounded-lg border border-border bg-card', className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.ComponentProps<typeof View>) {
  return <View className={cn('p-4', className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      className={cn('text-xl font-bold text-foreground', className)}
      {...props}
    />
  );
}
