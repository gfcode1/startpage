import { useNavigate, useLocation } from 'react-router-dom'
import { Paper, UnstyledButton, Text, Tooltip, Box } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Icon } from '@iconify/react'
import { apps } from '@/registry/apps'
import { usePlayerIsPlaying } from '@/stores/player-store'

const categories = [
  { key: 'productivity', label: 'Productivity' },
  { key: 'music', label: 'Music' },
  { key: 'utilities', label: 'Utilities' },
] as const

function DockItem({
  app,
  isActive,
  onClick,
  mobile,
}: {
  app: (typeof apps)[number]
  isActive: boolean
  onClick: () => void
  mobile: boolean
}) {
  const navColor = isActive
    ? 'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-6))'
    : 'transparent'

  if (mobile) {
    return (
      <UnstyledButton
        onClick={onClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          minWidth: 44,
          minHeight: 44,
          borderRadius: 'var(--mantine-radius-sm)',
          background: navColor,
          transition: 'background 0.15s',
          flex: '1 1 0',
        }}
        aria-label={app.name}
      >
        <Icon icon={app.icon} width={22} height={22} color={app.color} />
      </UnstyledButton>
    )
  }

  return (
    <Tooltip label={app.name} position="top" withArrow>
      <UnstyledButton
        onClick={onClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          padding: '4px 8px',
          borderRadius: 'var(--mantine-radius-md)',
          background: navColor,
          transition: 'background 0.15s, transform 0.12s',
          transform: isActive ? 'translateY(-2px)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive)
            e.currentTarget.style.background =
              'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-6))'
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent'
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--mantine-radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: app.color,
            color: 'var(--mantine-color-white)',
          }}
        >
          <Icon icon={app.icon} width={18} />
        </div>
        <Text size="xs" c="dimmed">
          {app.name}
        </Text>
      </UnstyledButton>
    </Tooltip>
  )
}

export function Dock() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const isMobile = useMediaQuery('(max-width: 47.999em)')
  const isPlaying = usePlayerIsPlaying()

  const renderDesktop = () => (
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
          <Box key={cat.key} style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {catApps.map((app) => {
              const basePath = app.path.replace(/\/:\w+\??(\/|$).*$/, '')
              const isActive = currentPath === app.path || currentPath === basePath || currentPath.startsWith(basePath + '/')
              return (
                <DockItem
                  key={app.id}
                  app={app}
                  isActive={isActive}
                  onClick={() => navigate(app.path.replace(/\/:\w+\??$/, ''))}
                  mobile={false}
                />
              )
            })}
            <Box
              style={{
                width: 1,
                height: 32,
                background:
                  'light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-6))',
                margin: '0 4px',
              }}
            />
          </Box>
        )
      })}
    </Paper>
  )

  const renderMobile = () => {
    if (isPlaying) return null
    return (
      <Paper
        withBorder
        shadow="md"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99,
          borderBottom: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: 0,
          padding: '6px 4px calc(6px + env(safe-area-inset-bottom, 0px))',
          borderRadius: 0,
        }}
        bg="var(--mantine-color-body)"
      >
        {apps.map((app) => {
          const basePath = app.path.replace(/\/:\w+\??(\/|$).*$/, '')
          const isActive = currentPath === app.path || currentPath === basePath || currentPath.startsWith(basePath + '/')
          return (
            <DockItem
              key={app.id}
              app={app}
              isActive={isActive}
              onClick={() => navigate(app.path.replace(/\/:\w+\??$/, ''))}
              mobile={true}
            />
          )
        })}
      </Paper>
    )
  }

  if (isMobile) {
    return (
      <>
        {renderMobile()}
        {isPlaying ? null : <Box style={{ height: 56 }} />}
      </>
    )
  }

  return renderDesktop()
}
