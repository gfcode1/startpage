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
  Group,
  Anchor,
} from '@mantine/core'
import { Icon } from '@iconify/react'
import {
  useProfileStore,
  useProfileError,
  useCloudProfiles,
  useCloudAuthLoading,
  useCloudAuthEmail,
} from '@/stores/profile-store'
import { APP_CONFIG } from '@/config/app'

type Mode = 'cloud-auth' | 'profile-list' | 'create-profile' | 'unlock-profile'

export function ProfileGate() {
  const {
    cloudLogin,
    cloudSignup,
    cloudLogout,
    createCloudProfile,
    unlockCloudProfile,
    clearError,
    isUnlocked,
  } = useProfileStore()
  const error = useProfileError()
  const cloudProfiles = useCloudProfiles()
  const cloudAuthLoading = useCloudAuthLoading()
  const cloudAuthEmail = useCloudAuthEmail()

  const isLoggedIn = !!cloudAuthEmail
  const initialMode: Mode = isLoggedIn ? 'profile-list' : 'cloud-auth'
  const [mode, setMode] = useState<Mode>(initialMode)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [supabasePassword, setSupabasePassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  if (isUnlocked) return null

  // ── Cloud auth handlers ─────────────────────────────────────────

  async function handleCloudAuth() {
    setLocalError(null)
    if (!email || !supabasePassword) {
      setLocalError('Email and password are required')
      return
    }
    setLoading(true)
    try {
      if (isSignup) {
        await cloudSignup(email, supabasePassword)
        setSupabasePassword('')
        setMode('create-profile')
      } else {
        await cloudLogin(email, supabasePassword)
        setSupabasePassword('')
        setMode('profile-list')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    cloudLogout()
    setMode('cloud-auth')
    setSupabasePassword('')
  }

  // ── Profile list handlers ───────────────────────────────────────

  function handleSelectProfile(id: string) {
    setSelectedProfileId(id)
    setPassword('')
    setLocalError(null)
    setMode('unlock-profile')
  }

  // ── Create profile handler ─────────────────────────────────────

  async function handleCreate() {
    setLocalError(null)
    if (!name.trim()) {
      setLocalError('Profile name is required')
      return
    }
    if (password.length < 4) {
      setLocalError('Password must be at least 4 characters')
      return
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await createCloudProfile(name, password)
    } finally {
      setLoading(false)
    }
  }

  // ── Unlock handler ─────────────────────────────────────────────

  async function handleUnlock() {
    if (!selectedProfileId || !password) return
    const cp = cloudProfiles.find((p) => p.id === selectedProfileId)
    if (!cp) return
    setLoading(true)
    try {
      await unlockCloudProfile(cp, password)
    } finally {
      setLoading(false)
    }
  }

  // ── Render helpers ─────────────────────────────────────────────

  function renderTitle(): string {
    switch (mode) {
      case 'cloud-auth': return isSignup ? 'Create Cloud Account' : 'Sign in to Cloud'
      case 'profile-list': return `Welcome to ${APP_CONFIG.name}`
      case 'create-profile': return 'Create Profile'
      case 'unlock-profile': return 'Unlock Profile'
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

          {isLoggedIn && (
            <Group>
              <Text size="xs" c="dimmed">{cloudAuthEmail}</Text>
              <Anchor size="xs" onClick={handleLogout}>Sign out</Anchor>
            </Group>
          )}

          {/* ── Cloud Auth ──────────────────────────────────────── */}
          {mode === 'cloud-auth' && (
            <Stack gap="sm" w="100%" mt="sm">
              <Text c="dimmed" size="sm" ta="center">
                {isSignup
                  ? 'Create a cloud account to store your encrypted profiles.'
                  : 'Sign in to access your cloud profiles.'}
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
                placeholder="Your cloud password"
                value={supabasePassword}
                onChange={(e) => setSupabasePassword(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCloudAuth()}
              />
              {(localError || error) && (
                <Alert color="red" variant="light" py="xs">
                  {localError || error}
                </Alert>
              )}
              <Button fullWidth onClick={handleCloudAuth} loading={loading || cloudAuthLoading}>
                {isSignup ? 'Create account' : 'Sign in'}
              </Button>
              <Anchor
                size="xs"
                ta="center"
                onClick={() => {
                  setIsSignup(!isSignup)
                  setLocalError(null)
                }}
              >
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Anchor>
            </Stack>
          )}

          {/* ── Profile List ────────────────────────────────────── */}
          {mode === 'profile-list' && (
            <>
              {cloudProfiles.length === 0 && (
                <Text c="dimmed" size="sm" ta="center" mt="sm">
                  No profiles yet. Create your first profile to get started.
                </Text>
              )}

              {cloudProfiles.length > 0 && (
                <Stack gap="xs" w="100%" mt="sm">
                  {cloudProfiles.map((cp) => (
                    <Button
                      key={cp.id}
                      variant="outline"
                      fullWidth
                      size="lg"
                      justify="start"
                      leftSection={<Icon icon="lucide:user" width={20} />}
                      onClick={() => handleSelectProfile(cp.id)}
                    >
                      {cp.name}
                    </Button>
                  ))}
                </Stack>
              )}

              <Divider my="sm" />

              <Button
                variant="light"
                fullWidth
                leftSection={<Icon icon="lucide:plus" width={20} />}
                onClick={() => {
                  setName('')
                  setPassword('')
                  setConfirmPassword('')
                  setLocalError(null)
                  setMode('create-profile')
                }}
              >
                Create new profile
              </Button>
            </>
          )}

          {/* ── Create Profile ──────────────────────────────────── */}
          {mode === 'create-profile' && (
            <Stack gap="sm" w="100%" mt="sm">
              <Text c="dimmed" size="sm" ta="center">
                Your data is encrypted with AES-256-GCM using this password.
                It cannot be recovered if forgotten.
              </Text>
              <TextInput
                label="Profile name"
                placeholder="e.g. Personal, Work"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                autoFocus
              />
              <PasswordInput
                label="Local password"
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
              {(localError || error) && (
                <Alert color="red" variant="light">
                  {localError || error}
                </Alert>
              )}
              <Button fullWidth onClick={handleCreate} loading={loading}>
                Create profile
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setMode('profile-list')}
              >
                Back
              </Button>
            </Stack>
          )}

          {/* ── Unlock Profile ──────────────────────────────────── */}
          {mode === 'unlock-profile' && (
            <Stack gap="sm" w="100%" mt="sm">
              <Text size="sm" ta="center">
                Profile: <b>{cloudProfiles.find((p) => p.id === selectedProfileId)?.name}</b>
              </Text>
              <PasswordInput
                label="Local password"
                placeholder="Enter your profile password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                autoFocus
              />
              {(localError || error) && (
                <Alert color="red" variant="light">
                  {localError || error}
                </Alert>
              )}
              <Button fullWidth onClick={handleUnlock} loading={loading}>
                Unlock
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  setMode('profile-list')
                  setSelectedProfileId(null)
                  clearError()
                }}
              >
                Back to profiles
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Center>
  )
}
