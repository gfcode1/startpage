import { useState } from 'react'
import {
  Center,
  Stack,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Alert,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import { useProfileStore, useProfiles, useProfileError } from '@/stores/profile-store'
import { APP_CONFIG } from '@/config/app'

export function ProfileGate() {
  const { createProfile, unlockProfile, clearError, isUnlocked } =
    useProfileStore()
  const profiles = useProfiles()
  const error = useProfileError()

  const noExistingProfiles = profiles.length === 0
  const [mode, setMode] = useState<'select' | 'create' | 'unlock'>(
    noExistingProfiles ? 'create' : 'select',
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  if (isUnlocked) return null

  async function handleCreate() {
    setCreateError(null)
    if (!name.trim()) {
      setCreateError('Profile name is required')
      return
    }
    if (password.length < 4) {
      setCreateError('Password must be at least 4 characters')
      return
    }
    if (password !== confirmPassword) {
      setCreateError('Passwords do not match')
      return
    }
    setLoading(true)
    await createProfile(name, password)
    setLoading(false)
  }

  async function handleUnlock() {
    if (!selectedId || !password) return
    setLoading(true)
    try {
      await unlockProfile(selectedId, password)
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(id: string) {
    setSelectedId(id)
    setPassword('')
    setMode('unlock')
  }

  return (
    <Center h="100vh" style={{ background: 'var(--mantine-color-body)' }}>
      <Paper
        p="xl"
        radius="lg"
        shadow="sm"
        maw={420}
        w="100%"
        style={{ border: '1px solid var(--mantine-color-default-border)' }}
      >
        <Stack gap="md" align="center">
          <Icon icon="lucide:shield" width={40} style={{ opacity: 0.7 }} />

          <Title order={3} ta="center">
            {mode === 'create'
              ? `Create Your Profile`
              : mode === 'select'
                ? `Welcome to ${APP_CONFIG.name}`
                : 'Enter Password'}
          </Title>

          <Text c="dimmed" size="sm" ta="center">
            {mode === 'create'
              ? 'Your data will be encrypted with your password.'
              : mode === 'select'
                ? 'Select a profile to continue.'
                : `Unlock "${profiles.find((p) => p.id === selectedId)?.name ?? ''}"`}
          </Text>

          {mode === 'select' && (
            <Stack gap="xs" w="100%" mt="sm">
              {profiles.map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  fullWidth
                  size="lg"
                  justify="start"
                  leftSection={<Icon icon="lucide:user" width={20} />}
                  onClick={() => handleSelect(p.id)}
                >
                  {p.name}
                </Button>
              ))}
            </Stack>
          )}

          {mode === 'unlock' && (
            <Stack gap="sm" w="100%" mt="sm">
              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                autoFocus
              />
              {error && (
                <Alert color="red" variant="light">
                  {error}
                </Alert>
              )}
              <Button fullWidth onClick={handleUnlock} loading={loading}>
                Unlock
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  setMode('select')
                  setSelectedId(null)
                  clearError()
                }}
              >
                Back to profile selection
              </Button>
            </Stack>
          )}

          {mode === 'create' && (
            <Stack gap="sm" w="100%" mt="sm">
              <TextInput
                label="Profile name"
                placeholder="e.g. Personal, Work"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                autoFocus
              />
              <PasswordInput
                label="Password"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
              <PasswordInput
                label="Confirm password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              {(createError || error) && (
                <Alert color="red" variant="light">
                  {createError || error}
                </Alert>
              )}
              <Text size="xs" c="dimmed" ta="center" mt={-4}>
                Your data is encrypted with AES-256-GCM. If you lose your password, your data cannot be recovered.
              </Text>
              <Button fullWidth onClick={handleCreate} loading={loading}>
                Create profile
              </Button>
              {profiles.length > 0 && (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setMode('select')}
                >
                  Back to profile selection
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Center>
  )
}
