import { getStorage } from './storage/engine'
import { APP_CONFIG } from '@/config/app'

export interface BackupData {
  version: string
  date: string
  appVersion: string
  data: Record<string, Record<string, unknown>>
}

export function exportBackup(): BackupData {
  const data = getStorage().getAll()
  return {
    version: '1',
    date: new Date().toISOString(),
    appVersion: APP_CONFIG.version,
    data,
  }
}

export function importBackup(json: string): boolean {
  try {
    const backup = JSON.parse(json) as BackupData
    if (!backup.version || !backup.data) return false
    getStorage().import(backup.data)
    return true
  } catch {
    return false
  }
}

export function downloadBackup(): void {
  const backup = exportBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `startdeck-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function uploadBackup(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = importBackup(reader.result as string)
      resolve(result)
    }
    reader.onerror = () => resolve(false)
    reader.readAsText(file)
  })
}
