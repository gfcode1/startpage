import { Stack, Center, Loader, Text, type StackProps } from '@mantine/core'

interface WidgetContainerProps extends StackProps {
  align?: 'center' | 'left'
}

export function WidgetContainer({ align = 'left', children, ...props }: WidgetContainerProps) {
  return (
    <Stack
      gap="xs"
      {...(align === 'center' ? { ta: 'center', align: 'center' } : {})}
      {...props}
    >
      {children}
    </Stack>
  )
}

export function WidgetLoading() {
  return (
    <Center py="md">
      <Loader size="sm" />
    </Center>
  )
}

export function WidgetEmpty({ children }: { children: string }) {
  return (
    <Text size="sm" c="dimmed" ta="center" py="md">
      {children}
    </Text>
  )
}
