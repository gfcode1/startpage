import { Container, Title } from '@mantine/core'
import { WidgetGrid } from '@/ui/widget-grid'
import { Dock } from '@/ui/dock'

export function Launcher() {
  return (
    <Container size="xl" py="md">
      <Title order={1} ta="center" mb="xl" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>
        StartDeck
      </Title>

      <WidgetGrid />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 80 }}>
        <Dock />
      </div>
    </Container>
  )
}
