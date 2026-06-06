import { useMemo, useEffect, useCallback, useRef, useState } from 'react'
import { Howl } from 'howler'

const FADE_DURATION = 250

export function useSoundPlayer(src: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const targetVolume = useRef(0.5)
  const fadeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFadingOut = useRef(false)

  const howl = useMemo<Howl | null>(() => {
    const h = new Howl({
      src: [src],
      loop: true,
      preload: false,
      html5: true,
      onload: () => {
        setIsLoading(false)
        setHasLoaded(true)
      },
      onloaderror: () => {
        setIsLoading(false)
      },
    })
    return h
  }, [src])

  const clearFade = useCallback(() => {
    if (fadeTimeout.current) {
      clearTimeout(fadeTimeout.current)
      fadeTimeout.current = null
    }
  }, [])

  const play = useCallback(() => {
    if (!howl) return
    isFadingOut.current = false
    clearFade()

    if (!hasLoaded && !isLoading) {
      setIsLoading(true)
      howl.load()
    }

    if (!howl.playing()) {
      howl.play()
    }

    const currentVol = howl.volume()
    const nextVol = targetVolume.current
    if (currentVol !== nextVol) {
      howl.fade(currentVol, nextVol, FADE_DURATION)
    }
  }, [howl, hasLoaded, isLoading, clearFade])

  const pause = useCallback((duration = FADE_DURATION) => {
    if (!howl) return
    isFadingOut.current = true
    clearFade()

    if (!howl.playing()) {
      isFadingOut.current = false
      howl.volume(targetVolume.current)
      return
    }

    const currentVol = howl.volume()
    if (duration <= 0 || currentVol <= 0) {
      howl.pause()
      isFadingOut.current = false
      howl.volume(targetVolume.current)
      return
    }

    howl.fade(currentVol, 0, duration)
    fadeTimeout.current = setTimeout(() => {
      howl.pause()
      isFadingOut.current = false
      howl.volume(targetVolume.current)
    }, duration)
  }, [howl, clearFade])

  const stop = useCallback(() => {
    isFadingOut.current = false
    clearFade()
    if (howl) {
      howl.stop()
      howl.volume(targetVolume.current)
    }
  }, [howl, clearFade])

  useEffect(() => {
    targetVolume.current = 0.5
  }, [])

  const setVolume = useCallback((vol: number) => {
    targetVolume.current = vol
    if (howl && !isFadingOut.current) {
      howl.volume(vol)
    }
  }, [howl])

  useEffect(() => {
    return () => {
      clearFade()
      if (howl) {
        howl.unload()
      }
    }
  }, [howl, clearFade])

  return { play, pause, stop, setVolume, isLoading, hasLoaded }
}
