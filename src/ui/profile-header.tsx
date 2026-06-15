import { Tooltip, ActionIcon, Text, Avatar, Menu } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useActiveProfile, useProfileStore, useProfiles, useIsUnlocked } from '@/stores/profile-store'

export function ProfileHeader() {
  const activeProfile = useActiveProfile()
  const isUnlocked = useIsUnlocked()
  const { lockProfile } = useProfileStore()
  const profiles = useProfiles()

  if (!isUnlocked || !activeProfile) return null

  const initial = activeProfile.name.charAt(0).toUpperCase()

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Tooltip label={activeProfile.name}>
          <ActionIcon
            variant="subtle"
            size="md"
            aria-label="Profile"
            style={{ cursor: 'pointer' }}
          >
            <Avatar size="sm" radius="xl" color="initials">
              {initial}
            </Avatar>
          </ActionIcon>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item leftSection={<Icon icon="lucide:user" width={16} />}>
          <Text size="sm">{activeProfile.name}</Text>
        </Menu.Item>

        {profiles.length > 1 && (
          <>
            <Menu.Divider />
            <Menu.Label>Switch profile</Menu.Label>
            {profiles
              .filter((p) => p.id !== activeProfile.id)
              .map((p) => (
                <Menu.Item
                  key={p.id}
                  leftSection={<Icon icon="lucide:user" width={16} />}
                  onClick={async () => {
                    await lockProfile()
                  }}
                >
                  {p.name}
                </Menu.Item>
              ))}
          </>
        )}

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={<Icon icon="lucide:lock" width={16} />}
          onClick={async () => {
            await lockProfile()
          }}
        >
          Lock profile
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
