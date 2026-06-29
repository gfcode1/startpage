import { Box } from '@mantine/core'
import { useBackgroundStore } from '@/stores/background-store'

interface SharedBackgroundProps {
  variant: 'home' | 'app'
}

const OVERLAYS = {
  home: {
    top: 0.55,
    center: 0.3,
    bottom: 0.6,
  },
  app: {
    top: 0.65,
    center: 0.45,
    bottom: 0.7,
  },
}

const BASE = '15,11,10'

function gradient(alpha: { top: number; center: number; bottom: number }) {
  return `linear-gradient(180deg, rgba(${BASE},${alpha.top}) 0%, rgba(${BASE},${alpha.center}) 50%, rgba(${BASE},${alpha.bottom}) 100%)`
}

export function SharedBackground({ variant }: SharedBackgroundProps) {
  const backgroundType = useBackgroundStore((s) => s.backgroundType)
  const backgroundColor = useBackgroundStore((s) => s.backgroundColor)
  const backgroundImage = useBackgroundStore((s) => s.backgroundImage)

  if (backgroundType === 'none') return null

  const alpha = OVERLAYS[variant]

  return (
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage:
          backgroundType === 'image' && backgroundImage
            ? `${gradient(alpha)}, url(${backgroundImage})`
            : gradient(alpha),
        backgroundSize:
          backgroundType === 'image' && backgroundImage ? 'auto, cover' : undefined,
        backgroundPosition:
          backgroundType === 'image' && backgroundImage ? '0 0, center' : undefined,
        backgroundColor:
          backgroundType === 'solid'
            ? backgroundColor
            : backgroundType === 'image' && !backgroundImage
              ? 'var(--mantine-color-dark-9)'
              : undefined,
      }}
    />
  )
}
