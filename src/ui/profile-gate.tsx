import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
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
  Grid,
  ThemeIcon,
  Badge,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Icon } from '@iconify/react'
import {
  useProfileStore,
  useProfileError,
  useCloudProfiles,
  useCloudAuthLoading,
  useCloudAuthEmail,
} from '@/stores/profile-store'
import type { CloudProfile } from '@/stores/profile-store'
import { APP_CONFIG } from '@/config/app'
import { apps } from '@/registry/apps'
import { widgets } from '@/registry/widgets'

type Mode = 'cloud-auth' | 'profile-list' | 'create-profile' | 'unlock-profile'

const FEATURES = [
  { icon: 'lucide:list-checks', label: 'Productivity suite', desc: 'Todo, Notes, Kanban, Calendar & Pomodoro timer' },
  { icon: 'lucide:headphones', label: 'Focus & Relax', desc: '84 ambient sounds, internet radio & focus timer' },
  { icon: 'lucide:globe', label: 'Live information', desc: 'Weather, world news & Wikipedia at a glance' },
  { icon: 'lucide:shield-check', label: 'Zero-knowledge encryption', desc: 'AES-256-GCM. Your data, your key only.' },
  { icon: 'lucide:layout-dashboard', label: 'Customizable widgets', desc: `${widgets.length} resizable widgets for your perfect dashboard` },
]

function FeatureCard({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <Group gap="sm" wrap="nowrap" align="flex-start">
      <ThemeIcon variant="light" size="lg" radius="md">
        <Icon icon={icon} width={20} />
      </ThemeIcon>
      <div>
        <Text size="sm" fw={600}>{label}</Text>
        <Text size="xs" c="dimmed">{desc}</Text>
      </div>
    </Group>
  )
}

function IntroSidebar() {
  return (
    <Stack gap="lg" maw={420}>
      <Group gap="sm">
        <ThemeIcon size={44} radius="md" variant="gradient" gradient={{ from: 'accent.5', to: 'accent.4' }}>
          <Icon icon="lucide:layers" width={24} />
        </ThemeIcon>
        <div>
          <Title order={2} ff="Space Grotesk, sans-serif" fw={700}>{APP_CONFIG.name}</Title>
          <Text size="sm" c="dimmed">Your personal command center</Text>
        </div>
      </Group>

      <Text size="sm" c="dimmed" lh={1.6}>
        A customizable startpage with apps, widgets, and tools — all encrypted end-to-end.
        Organize your day, stay focused, and keep everything at your fingertips.
      </Text>

      <Stack gap="sm">
        {FEATURES.map((f) => (
          <FeatureCard key={f.label} {...f} />
        ))}
      </Stack>

      <Group gap="xs">
        <Badge variant="light" leftSection={<Icon icon="lucide:app-window" width={12} />}>
          {apps.length} apps
        </Badge>
        <Badge variant="light" leftSection={<Icon icon="lucide:grid-2x2" width={12} />}>
          {widgets.length} widgets
        </Badge>
        <Badge variant="light" leftSection={<Icon icon="lucide:lock" width={12} />}>
          100% encrypted
        </Badge>
      </Group>

      <Text size="xs" c="dimmed" ta="center" mt="auto" pt="sm">
        v{APP_CONFIG.version}
      </Text>
    </Stack>
  )
}

interface AuthCardProps {
  mode: Mode
  setMode: Dispatch<SetStateAction<Mode>>
  isLoggedIn: boolean
  cloudAuthEmail: string | null
  cloudProfiles: CloudProfile[]
  cloudAuthLoading: boolean
  error: string | null
  localError: string | null
  setLocalError: Dispatch<SetStateAction<string | null>>
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
  email: string
  setEmail: Dispatch<SetStateAction<string>>
  supabasePassword: string
  setSupabasePassword: Dispatch<SetStateAction<string>>
  isSignup: boolean
  setIsSignup: Dispatch<SetStateAction<boolean>>
  name: string
  setName: Dispatch<SetStateAction<string>>
  password: string
  setPassword: Dispatch<SetStateAction<string>>
  confirmPassword: string
  setConfirmPassword: Dispatch<SetStateAction<string>>
  selectedProfileId: string | null
  setSelectedProfileId: Dispatch<SetStateAction<string | null>>
  onCloudAuth: () => Promise<void>
  onLogout: () => void
  onSelectProfile: (id: string) => void
  onCreate: () => Promise<void>
  onUnlock: () => Promise<void>
  onClearError: () => void
}

function AuthCard({
  mode,
  setMode,
  isLoggedIn,
  cloudAuthEmail,
  cloudProfiles,
  cloudAuthLoading,
  error,
  localError,
  setLocalError,
  loading,
  email,
  setEmail,
  supabasePassword,
  setSupabasePassword,
  isSignup,
  setIsSignup,
  name,
  setName,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  selectedProfileId,
  onCloudAuth,
  onLogout,
  onSelectProfile,
  onCreate,
  onUnlock,
  onClearError,
}: AuthCardProps) {
  function renderTitle(): string {
    switch (mode) {
      case 'cloud-auth': return isSignup ? 'Create Cloud Account' : 'Sign in to Cloud'
      case 'profile-list': return `Welcome to ${APP_CONFIG.name}`
      case 'create-profile': return 'Create Profile'
      case 'unlock-profile': return 'Unlock Profile'
    }
  }

  return (
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
            <Anchor size="xs" onClick={onLogout}>Sign out</Anchor>
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
              onKeyDown={(e) => e.key === 'Enter' && onCloudAuth()}
            />
            {(localError || error) && (
              <Alert color="red" variant="light" py="xs">
                {localError || error}
              </Alert>
            )}
            <Button fullWidth onClick={onCloudAuth} loading={loading || cloudAuthLoading}>
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
                    onClick={() => onSelectProfile(cp.id)}
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
              onKeyDown={(e) => e.key === 'Enter' && onCreate()}
            />
            {(localError || error) && (
              <Alert color="red" variant="light">
                {localError || error}
              </Alert>
            )}
            <Button fullWidth onClick={onCreate} loading={loading}>
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
              onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
              autoFocus
            />
            {(localError || error) && (
              <Alert color="red" variant="light">
                {localError || error}
              </Alert>
            )}
            <Button fullWidth onClick={onUnlock} loading={loading}>
              Unlock
            </Button>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => {
                setMode('profile-list')
                onClearError()
              }}
            >
              Back to profiles
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

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

  const isMobile = useMediaQuery('(max-width: 62em)') ?? false

  if (isUnlocked) return null

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

  function handleSelectProfile(id: string) {
    setSelectedProfileId(id)
    setPassword('')
    setLocalError(null)
    setMode('unlock-profile')
  }

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

  const authCardProps: AuthCardProps = {
    mode,
    setMode,
    isLoggedIn,
    cloudAuthEmail,
    cloudProfiles,
    cloudAuthLoading,
    error,
    localError,
    setLocalError,
    loading,
    setLoading,
    email,
    setEmail,
    supabasePassword,
    setSupabasePassword,
    isSignup,
    setIsSignup,
    name,
    setName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    selectedProfileId,
    setSelectedProfileId,
    onCloudAuth: handleCloudAuth,
    onLogout: handleLogout,
    onSelectProfile: handleSelectProfile,
    onCreate: handleCreate,
    onUnlock: handleUnlock,
    onClearError: clearError,
  }

  if (isMobile) {
    return (
      <Center mih="100vh" py="xl" style={{ background: 'var(--mantine-color-body)' }}>
        <Stack gap="xl" align="center" px="md" maw={420} w="100%">
          <IntroSidebar />
          <Divider w="60%" />
          <AuthCard {...authCardProps} />
        </Stack>
      </Center>
    )
  }

  return (
    <Center h="100vh" style={{ background: 'var(--mantine-color-body)' }}>
      <Grid maw={960} w="100%" px="xl" align="center" style={{ gap: 80 }}>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <IntroSidebar />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Center>
            <AuthCard {...authCardProps} />
          </Center>
        </Grid.Col>
      </Grid>
    </Center>
  )
}
