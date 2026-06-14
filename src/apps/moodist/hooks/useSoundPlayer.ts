import { useCallback, useRef, useState, useEffect } from 'react'
import { Howl } from 'howler'

const FADE_DURATION = 250

export function useSoundPlayer(src: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const targetVolume = useRef(0.5)
  const fadeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFadingOut = useRef(false)
  const howlRef = useRef<Howl | null>(null)

  const getHowl = useCallback(() => {
    if (!howlRef.current) {
      const h = new Howl({
        src: [src],
        loop: true,
        preload: false,
        html5: true,
        onload: () => { setIsLoading(false); setHasLoaded(true) },
        onloaderror: () => { setIsLoading(false); setHasError(true) },
      })
      howlRef.current = h
    }
    return howlRef.current
  }, [src])

  const clearFade = useCallback(() => {
    if (fadeTimeout.current) { clearTimeout(fadeTimeout.current); fadeTimeout.current = null }
  }, [])

  const play = useCallback(() => {
    const howl = getHowl()
    if (!howl) return
    isFadingOut.current = false
    clearFade()
    setHasError(false)
    if (!hasLoaded && !isLoading) { setIsLoading(true); howl.load() }
    if (!howl.playing()) howl.play()
    const currentVol = howl.volume()
    const nextVol = targetVolume.current
    if (currentVol !== nextVol) howl.fade(currentVol, nextVol, FADE_DURATION)
  }, [getHowl, hasLoaded, isLoading, clearFade])

  const pause = useCallback((duration = FADE_DURATION) => {
    const howl = howlRef.current
    if (!howl) return
    isFadingOut.current = true
    clearFade()
    if (!howl.playing()) { isFadingOut.current = false; howl.volume(targetVolume.current); return }
    const currentVol = howl.volume()
    if (duration <= 0 || currentVol <= 0) { howl.pause(); isFadingOut.current = false; howl.volume(targetVolume.current); return }
    howl.fade(currentVol, 0, duration)
    fadeTimeout.current = setTimeout(() => {
      howl.pause(); isFadingOut.current = false; howl.volume(targetVolume.current)
    }, duration)
  }, [clearFade])

  const stop = useCallback(() => {
    isFadingOut.current = false; clearFade()
    const howl = howlRef.current
    if (howl) { howl.stop(); howl.volume(targetVolume.current) }
  }, [clearFade])

  const setVolume = useCallback((vol: number) => {
    targetVolume.current = vol
    const howl = howlRef.current
    if (howl && !isFadingOut.current) howl.volume(vol)
  }, [])

  useEffect(() => {
    return () => { clearFade(); howlRef.current?.unload() }
  }, [clearFade])

  return { play, pause, stop, setVolume, isLoading, hasLoaded, hasError }
}
