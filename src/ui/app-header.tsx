import { Group, Text, ActionIcon, TextInput } from '@mantine/core'
import { Icon } from '@iconify/react'
import { ReactNode } from 'react'

interface ToolbarAction {
  id: string
  label: string
  icon: string
  onClick: () => void
  variant?: 'primary' | 'default'
}

interface AppHeaderProps {
  title: string
  subtitle?: string
  badge?: ReactNode
  actions?: ToolbarAction[]
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
}

export function AppHeader({ title, subtitle, badge, actions, search }: AppHeaderProps) {
  return (
    <Group justify="space-between" mb="md" wrap="nowrap">
      <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap">
            <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-heading-font-family)' }} truncate="end">
              {title}
            </Text>
            {badge}
          </Group>
          {subtitle && <Text size="sm" c="dimmed">{subtitle}</Text>}
        </div>
      </Group>

      <Group gap="xs" wrap="nowrap">
        {search && (
          <TextInput
            placeholder={search.placeholder ?? 'Search...'}
            value={search.value}
            onChange={(e) => search.onChange(e.currentTarget.value)}
            leftSection={<Icon icon="lucide:search" width={14} />}
            size="sm"
            style={{ width: 160 }}
          />
        )}
        {actions?.map((action) => (
          <ActionIcon
            key={action.id}
            variant={action.variant === 'primary' ? 'filled' : 'subtle'}
            onClick={action.onClick}
            aria-label={action.label}
            title={action.label}
          >
            <Icon icon={action.icon} width={18} />
          </ActionIcon>
        ))}
      </Group>
    </Group>
  )
}
