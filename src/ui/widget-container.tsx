import { Stack, Center, Loader, Text, Skeleton, type StackProps } from '@mantine/core'

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

export function WidgetSkeleton({ lines = 3, py = 'md' as const }: { lines?: number; py?: string }) {
  return (
    <Stack gap="xs" py={py}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? '60%' : '100%'} radius="sm" />
      ))}
    </Stack>
  )
}

export function WidgetEmpty({ children }: { children: string }) {
  return (
    <Text size="sm" c="dimmed" ta="center" py="md">
      {children}
    </Text>
  )
}
