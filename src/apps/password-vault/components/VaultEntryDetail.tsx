import { useState } from 'react'
import { Drawer, Stack, Group, Text, TextInput, Textarea, Avatar, CopyButton, Button, Badge, ActionIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import type { VaultEntry as VaultEntryType, Category } from '../types'
import { strengthScore, getFaviconUrl } from '../utils'

interface VaultEntryDetailProps {
  entry: VaultEntryType | null
  category?: Category
  opened: boolean
  onClose: () => void
  onEdit: (entry: VaultEntryType) => void
  onDelete: (id: string) => void
}

export default function VaultEntryDetail({ entry, category, opened, onClose, onEdit, onDelete }: VaultEntryDetailProps) {
  const [showPassword, setShowPassword] = useState(false)

  if (!entry) return null

  const strength = strengthScore(entry.password)
  const favicon = getFaviconUrl(entry.url)

  return (
    <Drawer opened={opened} onClose={onClose} title="Credential details" size="md" position="right">
      <Stack gap="md">
        <Group gap="md">
          <Avatar src={favicon} size={48} radius="sm">
            {entry.name[0]?.toUpperCase()}
          </Avatar>
          <div>
            <Text fw={700} size="lg">{entry.name}</Text>
            {category && (
              <Group gap={4}>
                <Icon icon={category.icon} width={14} color={category.color} />
                <Text size="sm" c="dimmed">{category.name}</Text>
              </Group>
            )}
          </div>
        </Group>

        <Badge size="sm" color={strength.color}>{strength.label}</Badge>

        <TextInput
          label="URL"
          value={entry.url}
          readOnly
          rightSection={
            entry.url ? (
              <CopyButton value={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}>
                {({ copied, copy }) => (
                  <ActionIcon size="sm" variant="subtle" onClick={copy}>
                    <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} width={14} />
                  </ActionIcon>
                )}
              </CopyButton>
            ) : null
          }
        />
        <TextInput
          label="Username"
          value={entry.username}
          readOnly
          rightSection={
            <CopyButton value={entry.username}>
              {({ copied, copy }) => (
                <ActionIcon size="sm" variant="subtle" onClick={copy}>
                  <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} width={14} />
                </ActionIcon>
              )}
            </CopyButton>
          }
        />
        <TextInput
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={entry.password}
          readOnly
          rightSection={
            <Group gap={4}>
              <ActionIcon size="sm" variant="subtle" onClick={() => setShowPassword(!showPassword)}>
                <Icon icon={showPassword ? 'lucide:eye-off' : 'lucide:eye'} width={14} />
              </ActionIcon>
              <CopyButton value={entry.password}>
                {({ copied, copy }) => (
                  <ActionIcon size="sm" variant="subtle" onClick={copy}>
                    <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} width={14} />
                  </ActionIcon>
                )}
              </CopyButton>
            </Group>
          }
        />

        {entry.notes && (
          <Textarea label="Notes" value={entry.notes} readOnly rows={3} />
        )}

        <Text size="xs" c="dimmed">
          Created: {new Date(entry.createdAt).toLocaleDateString()} · Updated: {new Date(entry.updatedAt).toLocaleDateString()}
        </Text>

        <Group gap="sm">
          <Button
            variant="light"
            leftSection={<Icon icon="lucide:pencil" width={14} />}
            onClick={() => onEdit(entry)}
          >
            Edit
          </Button>
          <Button
            variant="light"
            color="red"
            leftSection={<Icon icon="lucide:trash-2" width={14} />}
            onClick={() => { onDelete(entry.id); onClose() }}
          >
            Delete
          </Button>
        </Group>
      </Stack>
    </Drawer>
  )
}
