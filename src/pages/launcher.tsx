import { Container, Box } from '@mantine/core'
import { WidgetGrid } from '@/ui/widget-grid'
import { Dock } from '@/ui/dock'
import { useBackgroundStore } from '@/stores/background-store'

export function Launcher() {
  const backgroundType = useBackgroundStore((s) => s.backgroundType)
  const backgroundColor = useBackgroundStore((s) => s.backgroundColor)
  const backgroundImage = useBackgroundStore((s) => s.backgroundImage)

  const hasBackground = backgroundType !== 'none'

  const content = (
    <Container
      size="xl"
      py={{ base: 'xs', sm: 'md' }}
      px={{ base: 'xs', sm: 'md' }}
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <Dock />
      </div>

      <WidgetGrid />
    </Container>
  )

  if (!hasBackground) return content

  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundImage: backgroundType === 'image' && backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundColor: backgroundType === 'solid' ? backgroundColor : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        position: 'relative',
      }}
    >
      <Box
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 0,
        }}
      />
      {content}
    </Box>
  )
}
