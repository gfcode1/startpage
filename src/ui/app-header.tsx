import { useState } from 'react'
import { Group, Text, ActionIcon, TextInput, Collapse, Tooltip } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
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
  const isMobile = useMediaQuery('(max-width: 47.999em)')
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <Group justify="space-between" mb={searchOpen ? 0 : 'md'} wrap="nowrap">
        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
          {!searchOpen && (
            <div style={{ minWidth: 0 }}>
              <Group gap="xs" wrap="nowrap">
                <Text
                  fw={700}
                  size="lg"
                  style={{ fontFamily: 'var(--mantine-heading-font-family)' }}
                  truncate="end"
                >
                  {title}
                </Text>
                {badge}
              </Group>
              {subtitle && (
                <Text size="sm" c="dimmed" truncate="end">
                  {subtitle}
                </Text>
              )}
            </div>
          )}
        </Group>

        <Group gap="xs" wrap="nowrap">
          {search && isMobile ? (
            <ActionIcon
              variant={searchOpen ? 'filled' : 'subtle'}
              onClick={() => {
                setSearchOpen((o) => !o)
                if (searchOpen) search.onChange('')
              }}
              aria-label="Toggle search"
            >
              <Icon icon={searchOpen ? 'lucide:x' : 'lucide:search'} width={18} />
            </ActionIcon>
          ) : search ? (
            <TextInput
              placeholder={search.placeholder ?? 'Search...'}
              value={search.value}
              onChange={(e) => search.onChange(e.currentTarget.value)}
              leftSection={<Icon icon="lucide:search" width={14} />}
              size="sm"
              style={{ width: 160 }}
            />
          ) : null}
          {!searchOpen &&
            actions?.map((action) => (
              <Tooltip key={action.id} label={action.label}>
                <ActionIcon
                  variant={action.variant === 'primary' ? 'filled' : 'subtle'}
                  onClick={action.onClick}
                  aria-label={action.label}
                >
                  <Icon icon={action.icon} width={18} />
                </ActionIcon>
              </Tooltip>
            ))}
        </Group>
      </Group>

      {isMobile && search && (
        <Collapse expanded={searchOpen} mb="md">
          <TextInput
            placeholder={search.placeholder ?? 'Search...'}
            value={search.value}
            onChange={(e) => search.onChange(e.currentTarget.value)}
            leftSection={<Icon icon="lucide:search" width={14} />}
            size="sm"
            autoFocus
          />
        </Collapse>
      )}
    </>
  )
}
