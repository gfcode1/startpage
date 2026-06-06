import { BACKUP_VERSION, type BackupData, type NamespaceEntry, type BackupResult } from './types'

const PREFIX = 'gf'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export class PersistenceService {
  private static instance: PersistenceService
  private namespaces = new Map<string, Set<string>>()

  static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService()
    }
    return PersistenceService.instance
  }

  registerNamespace(appId: string, ...keys: string[]): void {
    let entry = this.namespaces.get(appId)
    if (!entry) {
      entry = new Set()
      this.namespaces.set(appId, entry)
    }
    for (const k of keys) entry.add(k)
  }

  unregisterNamespace(appId: string): void {
    this.namespaces.delete(appId)
  }

  unregisterKey(appId: string, key: string): void {
    const entry = this.namespaces.get(appId)
    if (entry) {
      entry.delete(key)
      if (entry.size === 0) {
        this.namespaces.delete(appId)
      }
    }
  }

  getRegisteredNamespaces(): NamespaceEntry[] {
    const result: NamespaceEntry[] = []
    for (const [appId, keys] of this.namespaces) {
      result.push({ appId, keys: [...keys] })
    }
    return result
  }

  private key(appId: string, k: string): string {
    return `${PREFIX}:${appId}:${k}`
  }

  exportAll(): BackupData {
    const data: Record<string, Record<string, unknown>> = {}

    for (const [appId, keys] of this.namespaces) {
      const appData: Record<string, unknown> = {}
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(this.key(appId, k))
          if (raw !== null) {
            appData[k] = JSON.parse(raw)
          }
        } catch (e) {
          console.warn(`PersistenceService: corrupt entry for ${appId}:${k}`, e)
        }
      }
      if (Object.keys(appData).length > 0) {
        data[appId] = appData
      }
    }

    const pkg = this.getPackageJson()

    return {
      version: BACKUP_VERSION,
      exportedAt: Date.now(),
      appVersion: pkg?.version ?? '0.0.0',
      data,
    }
  }

  importAll(backup: BackupData): BackupResult {
    if (!backup || backup.version !== BACKUP_VERSION) {
      return { success: false, error: `Unsupported backup version: ${backup?.version}. Current version: ${BACKUP_VERSION}` }
    }

    const appData = backup.data || {}
    let totalBytes = 0

    for (const [appId, entries] of Object.entries(appData)) {
      if (!entries || typeof entries !== 'object') continue
      for (const [k, value] of Object.entries(entries)) {
        const fullKey = this.key(appId, k)
        try {
          const serialized = JSON.stringify(value)
          totalBytes += serialized.length
          localStorage.setItem(fullKey, serialized)
        } catch (e) {
          console.warn(`PersistenceService: cannot save ${fullKey}`, e)
          return { success: false, error: `Cannot save ${fullKey}: storage full?` }
        }
      }
    }

    return { success: true, fileSize: totalBytes }
  }

  downloadBackup(filename?: string): void {
    if (!isBrowser()) return
    const backup = this.exportAll()
    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename ?? `gfcode-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  uploadBackup(file: File): Promise<BackupResult> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const backup = JSON.parse(reader.result as string) as BackupData
          resolve(this.importAll(backup))
        } catch (e) {
          console.warn('PersistenceService: invalid backup JSON', e)
          resolve({ success: false, error: 'The file does not contain valid JSON' })
        }
      }
      reader.onerror = () => {
        resolve({ success: false, error: 'Error reading file' })
      }
      reader.readAsText(file)
    })
  }

  private getPackageJson(): { version?: string } | null {
    try {
      return JSON.parse(
        document.querySelector('script[data-pkg]')?.getAttribute('data-pkg') ?? 'null'
      ) as { version?: string } | null
    } catch (e) {
      console.warn('PersistenceService: failed to read package.json data', e)
      return null
    }
  }
}

export const persistenceService = PersistenceService.getInstance()
