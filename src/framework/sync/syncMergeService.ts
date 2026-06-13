export type MergeStrategy = 'local_wins' | 'cloud_wins' | 'fill_missing'

type StorageMap = Record<string, Record<string, unknown>>

export function mergeStorageData(
  local: StorageMap,
  cloud: StorageMap | undefined,
  strategy: MergeStrategy,
): StorageMap {
  if (!cloud || Object.keys(cloud).length === 0) return local

  const allKeys = new Set([...Object.keys(local), ...Object.keys(cloud)])

  switch (strategy) {
    case 'local_wins': {
      const merged: StorageMap = {}
      for (const appId of allKeys) {
        merged[appId] = { ...(cloud[appId] ?? {}), ...(local[appId] ?? {}) }
      }
      return merged
    }

    case 'cloud_wins': {
      const merged: StorageMap = {}
      for (const appId of allKeys) {
        merged[appId] = { ...(local[appId] ?? {}), ...(cloud[appId] ?? {}) }
      }
      return merged
    }

    case 'fill_missing': {
      const merged: StorageMap = { ...local }
      for (const [appId, keys] of Object.entries(cloud)) {
        merged[appId] = { ...keys, ...(merged[appId] ?? {}) }
      }
      return merged
    }

    default:
      strategy satisfies never
      throw new Error(`Unknown merge strategy`)
  }
}
