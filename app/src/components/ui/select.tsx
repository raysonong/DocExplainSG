import { Check, ChevronDown } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { cn } from '../../lib/utils';
import { Text } from './text';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

type Anchor = { x: number; y: number; width: number; height: number };

/**
 * Dropdown select (shadcn-style). The list opens anchored directly beneath the
 * trigger (measured at open time), with a transparent tap-to-close overlay — no
 * dimmed backdrop. The trigger shows the current label + description.
 */
export function Select<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<View>(null);
  const current = options.find((o) => o.value === value);

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: open }}
        className="min-h-[56px] flex-row items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3 active:opacity-80"
      >
        <View className="flex-1 pr-2">
          <Text className="text-base font-bold text-foreground">{current?.label}</Text>
          {current?.description ? (
            <Text className="text-sm text-muted-foreground">{current.description}</Text>
          ) : null}
        </View>
        <ChevronDown color="#A1A1AA" size={20} />
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        {/* Transparent overlay — closes on outside tap, no dim */}
        <Pressable className="flex-1" onPress={() => setOpen(false)}>
          {anchor ? (
            <View
              style={{
                position: 'absolute',
                top: anchor.y + anchor.height + 6,
                left: anchor.x,
                width: anchor.width,
                shadowColor: '#000',
                shadowOpacity: 0.4,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
              className="gap-1 rounded-2xl border border-border bg-popover p-2"
            >
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={o.label}
                    className={cn(
                      'flex-row items-start gap-3 rounded-xl p-3 active:opacity-80',
                      active && 'bg-secondary',
                    )}
                  >
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">{o.label}</Text>
                      {o.description ? (
                        <Text className="mt-0.5 text-sm text-muted-foreground">
                          {o.description}
                        </Text>
                      ) : null}
                    </View>
                    {active ? (
                      <Check color="#FAFAFA" size={20} style={{ marginTop: 2 }} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}
