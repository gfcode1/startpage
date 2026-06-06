export const BACKUP_VERSION = 1

export interface BackupData {
  version: number
  exportedAt: number
  appVersion: string
  data: Record<string, Record<string, unknown>>
}

export interface NamespaceEntry {
  appId: string
  keys: string[]
}

export type BackupResult = { success: true; fileSize: number } | { success: false; error: string }
