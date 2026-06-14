import { Container, Title, Text, Button } from '@mantine/core'
import { useNavigate } from 'react-router-dom'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <Container size="sm" py="xl" style={{ textAlign: 'center' }}>
      <Title order={1}>404</Title>
      <Text c="dimmed" mb="lg">This page does not exist.</Text>
      <Button onClick={() => navigate('/')}>Go home</Button>
    </Container>
  )
}
