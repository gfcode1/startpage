import { BACKUP_VERSION, type BackupData, type NamespaceEntry, type BackupResult } from './types'
import { storageEngine } from '../storage/StorageEngine'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export class PersistenceService {
  private static instance: PersistenceService

  static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService()
    }
    return PersistenceService.instance
  }

  registerNamespace(appId: string, ...keys: string[]): void {
    for (const k of keys) {
      storageEngine.register(appId, k)
    }
  }

  unregisterNamespace(_appId: string): void {
    // no-op: StorageEngine auto-registers on write; unregistration is not supported
  }

  unregisterKey(_appId: string, _key: string): void {
    // no-op: StorageEngine auto-registers on write; unregistration is not supported
  }

  getRegisteredNamespaces(): NamespaceEntry[] {
    return storageEngine.getRegisteredNamespaces()
  }

  exportAll(): BackupData {
    const data = storageEngine.getAllState()

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
        try {
          const serialized = JSON.stringify(value)
          totalBytes += serialized.length
          storageEngine.set(appId, k, value)
        } catch (e) {
          console.warn(`PersistenceService: cannot save ${appId}:${k}`, e)
          return { success: false, error: `Cannot save ${appId}:${k}: storage full?` }
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
