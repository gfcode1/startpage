import { useState, useCallback } from 'react'
import { Stack, Group, Text, Slider, Checkbox, Button, TextInput, CopyButton, Badge } from '@mantine/core'
import { generatePassword, strengthScore } from '../utils'

interface PasswordGeneratorProps {
  onSelect: (password: string) => void
  initialLength?: number
}

const DEFAULT_OPTIONS = { uppercase: true, lowercase: true, digits: true, special: false }

function makePassword(length: number, options: typeof DEFAULT_OPTIONS) {
  return generatePassword(length, options)
}

export default function PasswordGenerator({ onSelect, initialLength = 16 }: PasswordGeneratorProps) {
  const [length, setLength] = useState(initialLength)
  const [options, setOptions] = useState(DEFAULT_OPTIONS)
  const [password, setPassword] = useState(() => makePassword(initialLength, DEFAULT_OPTIONS))

  const regenerate = useCallback(() => {
    setPassword(makePassword(length, options))
  }, [length, options])

  const strength = password ? strengthScore(password) : null

  return (
    <Stack gap="sm">
      <TextInput
        value={password}
        readOnly
        size="sm"
        rightSection={
          <Group gap={4}>
            <CopyButton value={password}>
              {({ copied, copy }) => (
                <Button size="compact-xs" variant="subtle" onClick={copy}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </CopyButton>
            <Button size="compact-xs" variant="subtle" onClick={() => onSelect(password)}>
              Use
            </Button>
          </Group>
        }
      />

      {strength && (
        <Group justify="space-between">
          <Text size="xs" c="dimmed">{length} chars</Text>
          <Badge size="sm" color={strength.color}>{strength.label}</Badge>
        </Group>
      )}

      <Slider value={length} onChange={setLength} min={8} max={64} step={1} size="xs" />

      <Group gap="xs">
        <Checkbox
          label="A-Z"
          size="xs"
          checked={options.uppercase}
          onChange={(e) => setOptions((o) => ({ ...o, uppercase: e.currentTarget.checked }))}
        />
        <Checkbox
          label="a-z"
          size="xs"
          checked={options.lowercase}
          onChange={(e) => setOptions((o) => ({ ...o, lowercase: e.currentTarget.checked }))}
        />
        <Checkbox
          label="0-9"
          size="xs"
          checked={options.digits}
          onChange={(e) => setOptions((o) => ({ ...o, digits: e.currentTarget.checked }))}
        />
        <Checkbox
          label="!@#$"
          size="xs"
          checked={options.special}
          onChange={(e) => setOptions((o) => ({ ...o, special: e.currentTarget.checked }))}
        />
      </Group>

      <Button size="compact-sm" variant="light" onClick={regenerate} fullWidth>
        Regenerate
      </Button>
    </Stack>
  )
}
