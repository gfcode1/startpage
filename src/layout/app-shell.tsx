import { useState, type ReactNode } from 'react'
import { AppShell, Group, ActionIcon, Text, useMantineColorScheme, Tooltip } from '@mantine/core'
import { useNavigate, useLocation } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { APP_CONFIG } from '@/config/app'
import { PlayerBar } from '@/ui/player-bar'
import { InstallPrompt } from '@/ui/install-prompt'
import { SettingsModal } from '@/ui/settings-modal'
import { ProfileHeader } from '@/ui/profile-header'
import { usePlayerIsPlaying } from '@/stores/player-store'

interface AppShellWrapperProps {
  children: ReactNode
}

export function AppShellWrapper({ children }: AppShellWrapperProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { toggleColorScheme, colorScheme } = useMantineColorScheme()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isPlaying = usePlayerIsPlaying()
  const isHome = location.pathname === '/'

  const playerHeight = isPlaying ? 64 : 0

  return (
    <AppShell
      header={{ height: 56 }}
      padding="md"
      footer={{ height: playerHeight }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            {!isHome && (
              <Tooltip label="Home">
                <ActionIcon variant="subtle" onClick={() => navigate('/')} aria-label="Home">
                  <Icon icon="lucide:home" width={20} />
                </ActionIcon>
              </Tooltip>
            )}
            <Text
              fw={700}
              style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem' }}
            >
              {isHome ? APP_CONFIG.name : ''}
            </Text>
          </Group>

          <Group gap="xs">
            <ProfileHeader />
            <Tooltip label={colorScheme === 'dark' ? 'Light mode' : 'Dark mode'}>
              <ActionIcon variant="subtle" onClick={toggleColorScheme} aria-label="Toggle theme">
                <Icon icon={colorScheme === 'dark' ? 'lucide:sun' : 'lucide:moon'} width={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Settings">
              <ActionIcon variant="subtle" onClick={() => setSettingsOpen(true)} aria-label="Settings">
                <Icon icon="lucide:settings" width={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {children}
        <div style={{ height: playerHeight }} />
      </AppShell.Main>

      <AppShell.Footer>
        <PlayerBar />
      </AppShell.Footer>

      <InstallPrompt />
      <SettingsModal opened={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </AppShell>
  )
}
