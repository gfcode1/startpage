import { useState } from 'react'
import { Modal, Stack, Text, TextInput, PasswordInput, Button, Alert, Anchor } from '@mantine/core'
import { useProfileStore, useCloudLinked } from '@/stores/profile-store'
import { showSyncNotification } from '@/lib/sync/notify'

export function CloudOnboardingDialog() {
  const { showCloudOnboarding, dismissCloudOnboarding, linkToCloud } = useProfileStore()
  const cloudLinked = useCloudLinked()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skip, setSkip] = useState(false)

  if (!showCloudOnboarding || skip || cloudLinked) return null

  async function handleEnable() {
    setError(null)
    if (!email.trim() || !password) {
      setError('Email and password are required')
      return
    }

    setLoading(true)
    try {
      // First sign up, then link
      const { SyncService } = await import('@/lib/sync/sync-service')
      const svc = SyncService.getInstance()
      await svc.signup(email, password).catch(() => {
        // If signup fails (email exists), try login
        return svc.login(email, password)
      })
      await linkToCloud(email, password)
      showSyncNotification('success', 'Cloud sync enabled', 'Your data is now backed up to the cloud')
      dismissCloudOnboarding()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  function handleSkip() {
    setSkip(true)
    dismissCloudOnboarding()
  }

  return (
    <Modal
      opened
      onClose={handleSkip}
      title="Enable Cloud Sync?"
      size="sm"
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Sync your data across devices with end-to-end encryption.
        </Text>

        <TextInput
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          autoFocus
        />

        <PasswordInput
          label="Password"
          placeholder="Cloud account password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleEnable()}
        />

        {error && (
          <Alert color="red" variant="light" py="xs">{error}</Alert>
        )}

        <Button fullWidth onClick={handleEnable} loading={loading}>
          Enable cloud sync
        </Button>

        <Anchor
          component="button"
          onClick={handleSkip}
          size="sm"
          c="dimmed"
          ta="center"
        >
          Skip — I'll do this later
        </Anchor>
      </Stack>
    </Modal>
  )
}
