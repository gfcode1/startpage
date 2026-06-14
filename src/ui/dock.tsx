import { useNavigate, useLocation } from 'react-router-dom'
import { Paper, UnstyledButton, Text, Tooltip } from '@mantine/core'
import { Icon } from '@iconify/react'
import { apps } from '@/registry/apps'

const categories = [
  { key: 'productivity', label: 'Productivity' },
  { key: 'music', label: 'Music' },
  { key: 'utilities', label: 'Utilities' },
] as const

export function Dock() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <Paper
      withBorder
      p="xs"
      radius="xl"
      shadow="lg"
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
        overflow: 'auto',
        maxWidth: '100%',
      }}
      bg="var(--mantine-color-body)"
    >
      {categories.map((cat) => {
        const catApps = apps.filter((a) => a.category === cat.key)
        if (catApps.length === 0) return null
        return (
          <div key={cat.key} style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {catApps.map((app) => {
              const isActive = currentPath === app.path
              return (
                <Tooltip key={app.id} label={app.name} position="top" withArrow>
                  <UnstyledButton
                    onClick={() => navigate(app.path)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      padding: '4px 8px',
                      borderRadius: 8,
                      background: isActive ? 'var(--mantine-color-dark-6)' : 'transparent',
                      transition: 'background 0.15s, transform 0.12s',
                      transform: isActive ? 'translateY(-2px)' : 'none',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--mantine-color-dark-6)' }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: app.color,
                        color: '#fff',
                      }}
                    >
                      <Icon icon={app.icon} width={18} />
                    </div>
                    <Text size="xs" c="dimmed" style={{ fontSize: '0.6rem', lineHeight: 1 }}>
                      {app.name}
                    </Text>
                  </UnstyledButton>
                </Tooltip>
              )
            })}
            <div style={{ width: 1, height: 32, background: 'var(--mantine-color-dark-6)', margin: '0 4px' }} />
          </div>
        )
      })}
    </Paper>
  )
}
