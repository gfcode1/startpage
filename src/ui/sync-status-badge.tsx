import { useState, useEffect } from 'react'
import { Tooltip, Text, HoverCard, Group, Button } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useCloudLinked, useLastSyncAt, useIsSyncing, useSyncError, useCloudEmail, useProfileStore } from '@/stores/profile-store'
import { SyncService } from '@/lib/sync/sync-service'

export function SyncStatusBadge() {
  const cloudLinked = useCloudLinked()
  const lastSyncAt = useLastSyncAt()
  const isSyncing = useIsSyncing()
  const syncError = useSyncError()
  const cloudEmail = useCloudEmail()
  const { updateSyncStatus } = useProfileStore()
  const [now, setNow] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  if (!cloudLinked) return null

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return 'Never'
    const diff = now - timestamp
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return `${Math.floor(diff / 3600000)}h ago`
  }

  const handleSyncNow = async () => {
    updateSyncStatus(null, true, null)
    try {
      const svc = SyncService.getInstance()
      await svc.syncNow()
      updateSyncStatus(Date.now(), false, svc.lastError)
    } catch {
      const svc = SyncService.getInstance()
      updateSyncStatus(null, false, svc.lastError)
    }
  }

  const icon = isSyncing ? 'lucide:loader' : syncError ? 'lucide:cloud-off' : 'lucide:cloud'
  const color = syncError ? 'red' : isSyncing ? 'yellow' : 'green'
  const label = isSyncing ? 'Syncing...' : syncError ? 'Sync error' : `Synced ${formatLastSync(lastSyncAt)}`

  return (
    <HoverCard shadow="md" width={240} withinPortal>
      <HoverCard.Target>
        <Tooltip label={label}>
          <Icon
            icon={icon}
            width={16}
            color={`var(--mantine-color-${color}-6)`}
            className={isSyncing ? 'animate-spin' : ''}
            style={{ cursor: 'pointer', display: 'block' }}
          />
        </Tooltip>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Text size="xs" mb="xs">
          Connected as <b>{cloudEmail}</b>
        </Text>
        <Group justify="space-between" mb="xs">
          <Text size="xs" c="dimmed">Last sync: {formatLastSync(lastSyncAt)}</Text>
          <Button size="compact-xs" variant="light" onClick={handleSyncNow} loading={isSyncing}>
            Sync now
          </Button>
        </Group>
        {syncError && (
          <Text size="xs" c="red">{syncError}</Text>
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  )
}
