import { useState, useCallback } from 'react'
import { Text, Group, Button, TextInput, Slider, Badge, CopyButton } from '@mantine/core'
import { Icon } from '@iconify/react'

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'

function generatePassword(length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return result
}

export default function PasswordWidget() {
  const [length, setLength] = useState(16)
  const [password, setPassword] = useState(() => generatePassword(16))

  const regenerate = useCallback(() => {
    setPassword(generatePassword(length))
  }, [length])

  return (
    <div>
      <Group justify="space-between" mb="xs">
        <Text size="xs" c="dimmed">{length} chars</Text>
        <Badge size="xs" variant="light">
          {password.match(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/) ? 'Strong' : 'Good'}
        </Badge>
      </Group>
      <TextInput
        value={password}
        readOnly
        size="sm"
        mb="xs"
        rightSection={
          <CopyButton value={password}>
            {({ copied, copy }) => (
              <Button size="compact-xs" variant="subtle" onClick={copy}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </CopyButton>
        }
      />
      <Slider value={length} onChange={setLength} min={8} max={64} step={1} size="xs" mb="xs" />
      <Button size="compact-xs" variant="light" onClick={regenerate} fullWidth>
        <Icon icon="lucide:rotate-ccw" width={12} /> Generate
      </Button>
    </div>
  )
}
