import { Container } from '@mantine/core'
import { WidgetGrid } from '@/ui/widget-grid'
import { Dock } from '@/ui/dock'

export function Launcher() {
  return (
    <Container size="xl" py="md">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <Dock />
      </div>

      <WidgetGrid />
    </Container>
  )
}
