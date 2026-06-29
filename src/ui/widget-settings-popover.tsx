import { Popover, Stack, NativeSelect, Switch, TextInput, NumberInput, Slider, ColorInput, Text, Group } from '@mantine/core'
import type { WidgetOption } from '@/registry/widgets'
import { useWidgetOptionsStore } from '@/stores/widget-options-store'

interface WidgetSettingsPopoverProps {
  widgetId: string
  options: WidgetOption[]
  children: React.ReactNode
}

function SettingField({ widgetId, option }: { widgetId: string; option: WidgetOption }) {
  const value = useWidgetOptionsStore((s) => s.options[widgetId]?.[option.key]) ?? option.defaultValue
  const setOption = useWidgetOptionsStore((s) => s.setOption)

  switch (option.type) {
    case 'select':
      return (
        <NativeSelect
          label={option.label}
          size="xs"
          data={option.options?.map((o) => ({ value: o.value, label: o.label })) ?? []}
          value={value as string}
          onChange={(e) => setOption(widgetId, option.key, e.currentTarget.value)}
        />
      )
    case 'toggle':
      return (
        <Switch
          label={option.label}
          size="xs"
          checked={value as boolean}
          onChange={(e) => setOption(widgetId, option.key, e.currentTarget.checked)}
        />
      )
    case 'text':
      return (
        <TextInput
          label={option.label}
          size="xs"
          value={value as string}
          onChange={(e) => setOption(widgetId, option.key, e.currentTarget.value)}
        />
      )
    case 'number':
      return (
        <NumberInput
          label={option.label}
          size="xs"
          min={option.min}
          max={option.max}
          value={value as number}
          onChange={(v) => setOption(widgetId, option.key, v)}
        />
      )
    case 'range':
      return (
        <Stack gap={4}>
          <Group justify="space-between">
            <Text size="xs">{option.label}</Text>
            <Text size="xs" c="dimmed">{String(value)}</Text>
          </Group>
          <Slider
            size="xs"
            min={option.min ?? 0}
            max={option.max ?? 100}
            value={value as number}
            onChange={(v) => setOption(widgetId, option.key, v)}
          />
        </Stack>
      )
    case 'color':
      return (
        <ColorInput
          label={option.label}
          size="xs"
          value={value as string}
          onChange={(v) => setOption(widgetId, option.key, v)}
        />
      )
  }
}

export function WidgetSettingsPopover({ widgetId, options, children }: WidgetSettingsPopoverProps) {
  return (
    <Popover width={300} position="bottom-end" shadow="md" withArrow>
      <Popover.Target>
        {children}
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="md">
          {options.map((option) => (
            <SettingField key={option.key} widgetId={widgetId} option={option} />
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
