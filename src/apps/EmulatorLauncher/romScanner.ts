import type { ScannedGame, SystemId } from './constants'

interface RomManifestEntry {
  path: string
  title: string
  system: string
  fileName: string
}

interface RomManifest {
  roms: RomManifestEntry[]
}

export async function scanBundledRoms(): Promise<ScannedGame[]> {
  try {
    const base = import.meta.env.BASE_URL || '/'
    const res = await fetch(`${base}roms-manifest.json`)
    if (!res.ok) return []
    const data: RomManifest = await res.json()
    return data.roms.map(entry => ({
      id: `bundled:${entry.system}:${entry.fileName}`,
      title: entry.title,
      system: entry.system as SystemId,
      fileName: entry.fileName,
      romUrl: `${base}emulator-roms/${entry.path}`,
    }))
  } catch {
    return []
  }
}
