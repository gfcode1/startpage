import { Affix, Button, Paper, Text, Transition } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useInstallPrompt } from '@/hooks/use-install-prompt'

export function InstallPrompt() {
  const { canInstall, install } = useInstallPrompt()

  return (
    <Transition mounted={canInstall} transition="slide-up" duration={300}>
      {(styles) => (
        <Affix position={{ bottom: 80, right: 20 }} style={styles}>
          <Paper withBorder p="sm" shadow="md" radius="md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon icon="lucide:download" width={20} />
            <Text size="sm" fw={500}>Install app</Text>
            <Button size="compact-sm" onClick={install}>Install</Button>
          </Paper>
        </Affix>
      )}
    </Transition>
  )
}
