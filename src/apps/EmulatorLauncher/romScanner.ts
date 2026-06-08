import { type ScannedGame, type SystemId, VALID_SYSTEMS } from './constants'

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
    const results: ScannedGame[] = []
    for (const entry of data.roms) {
      if (!VALID_SYSTEMS.has(entry.system as SystemId)) {
        console.warn(`romScanner: skipping entry with unknown system "${entry.system}" — ${entry.fileName}`)
        continue
      }
      results.push({
        id: `bundled:${entry.system}:${entry.fileName}`,
        title: entry.title,
        system: entry.system as SystemId,
        fileName: entry.fileName,
        romUrl: `${base}emulator-roms/${entry.path}`,
      })
    }
    return results
  } catch (e) {
    console.warn('romScanner: failed to scan bundled ROMs', e)
    return []
  }
}
