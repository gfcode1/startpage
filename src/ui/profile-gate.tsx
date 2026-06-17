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
  Divider,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import {
  useProfileStore,
  useProfiles,
  useProfileError,
  useCloudProfiles,
  useCloudAuthLoading,
} from '@/stores/profile-store'
import { APP_CONFIG } from '@/config/app'

export function ProfileGate() {
  const {
    createProfile,
    unlockProfile,
    clearError,
    isUnlocked,
    cloudLogin,
    adoptCloudProfile,
  } = useProfileStore()
  const profiles = useProfiles()
  const error = useProfileError()
  const cloudProfiles = useCloudProfiles()
  const cloudAuthLoading = useCloudAuthLoading()

  const noExistingProfiles = profiles.length === 0

  type Mode = 'select' | 'create' | 'unlock' | 'cloud-login' | 'cloud-unlock'
  const [mode, setMode] = useState<Mode>(
    noExistingProfiles ? 'create' : 'select',
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [cloudEmailInput, setCloudEmailInput] = useState('')
  const [cloudPasswordInput, setCloudPasswordInput] = useState('')
  const [cloudError, setCloudError] = useState<string | null>(null)
  const [selectedCloudId, setSelectedCloudId] = useState<string | null>(null)
  const [cloudLoginDone, setCloudLoginDone] = useState(false)

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

  async function handleCloudLogin() {
    setCloudError(null)
    if (!cloudEmailInput || !cloudPasswordInput) {
      setCloudError('Email and password are required')
      return
    }
    setLoading(true)
    await cloudLogin(cloudEmailInput, cloudPasswordInput)
    setCloudPasswordInput('')
    setCloudLoginDone(true)
    setLoading(false)
  }

  async function handleCloudAdopt() {
    if (!selectedCloudId || !password) return
    const cp = cloudProfiles.find((p) => p.id === selectedCloudId)
    if (!cp) return
    setLoading(true)
    try {
      await adoptCloudProfile(cp, password)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectCloud(id: string) {
    setSelectedCloudId(id)
    setPassword('')
    setMode('cloud-unlock')
  }

  function renderTitle(): string {
    switch (mode) {
      case 'create': return 'Create Your Profile'
      case 'select': return `Welcome to ${APP_CONFIG.name}`
      case 'unlock': return 'Enter Password'
      case 'cloud-login': return 'Sign in to Cloud'
      case 'cloud-unlock': return 'Unlock Cloud Profile'
    }
  }

  function renderDescription(): string {
    switch (mode) {
      case 'create':
        return 'Your data will be encrypted with your password.'
      case 'select':
        return 'Select a profile to continue, or sign in to the cloud.'
      case 'unlock':
        return `Unlock "${profiles.find((p) => p.id === selectedId)?.name ?? ''}"`
      case 'cloud-login':
        return 'Sign in to discover your cloud profiles.'
      case 'cloud-unlock':
        return `Unlock "${cloudProfiles.find((p) => p.id === selectedCloudId)?.name ?? ''}" from cloud`
    }
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
            {renderTitle()}
          </Title>

          <Text c="dimmed" size="sm" ta="center">
            {renderDescription()}
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

              <Divider label="or" labelPosition="center" my="sm" />

              <Button
                variant="subtle"
                fullWidth
                leftSection={<Icon icon="lucide:cloud" width={20} />}
                onClick={() => setMode('cloud-login')}
              >
                Sign in to cloud
              </Button>

              <Button
                variant="subtle"
                fullWidth
                leftSection={<Icon icon="lucide:plus" width={20} />}
                onClick={() => {
                  setName('')
                  setPassword('')
                  setConfirmPassword('')
                  setCreateError(null)
                  setMode('create')
                }}
              >
                Create new profile
              </Button>
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

          {mode === 'cloud-login' && (
            <Stack gap="sm" w="100%" mt="sm">
              <TextInput
                label="Email"
                placeholder="your@email.com"
                value={cloudEmailInput}
                onChange={(e) => setCloudEmailInput(e.currentTarget.value)}
                autoFocus
              />
              <PasswordInput
                label="Password"
                placeholder="Your Supabase password"
                value={cloudPasswordInput}
                onChange={(e) => setCloudPasswordInput(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCloudLogin()}
              />
              {(cloudError || error) && (
                <Alert color="red" variant="light" py="xs">
                  {cloudError || error}
                </Alert>
              )}
              <Button fullWidth onClick={handleCloudLogin} loading={loading || cloudAuthLoading}>
                Sign in
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  setMode('select')
                  setCloudLoginDone(false)
                  clearError()
                }}
              >
                Back
              </Button>
            </Stack>
          )}

          {mode === 'cloud-login' && cloudLoginDone && cloudProfiles.length === 0 && (
            <Text c="dimmed" size="sm" ta="center" mt="sm">
              No cloud profiles found. Create a local profile first and connect it via Settings → Cloud Sync.
            </Text>
          )}

          {mode === 'cloud-login' && cloudProfiles.length > 0 && (
            <Stack gap="xs" w="100%" mt="sm">
              <Divider label="Your cloud profiles" labelPosition="center" my="sm" />
              {cloudProfiles
                .filter((cp) => !profiles.find((p) => p.id === cp.id))
                .map((cp) => (
                  <Button
                    key={cp.id}
                    variant="outline"
                    fullWidth
                    size="lg"
                    justify="start"
                    leftSection={<Icon icon="lucide:cloud" width={20} />}
                    onClick={() => handleSelectCloud(cp.id)}
                  >
                    {cp.name}
                  </Button>
                ))}
            </Stack>
          )}

          {mode === 'cloud-unlock' && (
            <Stack gap="sm" w="100%" mt="sm">
              <Text size="sm" ta="center">
                Cloud profile: <b>{cloudProfiles.find((p) => p.id === selectedCloudId)?.name}</b>
              </Text>
              <PasswordInput
                label="Password"
                placeholder="Enter your profile password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCloudAdopt()}
                autoFocus
              />
              {error && (
                <Alert color="red" variant="light">
                  {error}
                </Alert>
              )}
              <Button fullWidth onClick={handleCloudAdopt} loading={loading}>
                Unlock & Download
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  setMode('cloud-login')
                  setSelectedCloudId(null)
                  clearError()
                }}
              >
                Back to cloud profiles
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
