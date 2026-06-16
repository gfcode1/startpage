import { getStorage } from '@/lib/storage/engine'
import { generateId } from '@/lib/utils/id'
import type { VaultEntry, Category } from './types'

const DATA_KEY = 'vault:data'

export interface PersistedData {
  entries: VaultEntry[]
  categories: Category[]
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Work', icon: 'lucide:briefcase', color: '#4a9eff' },
  { id: 'cat-personal', name: 'Personal', icon: 'lucide:user', color: '#22c55e' },
  { id: 'cat-social', name: 'Social', icon: 'lucide:users', color: '#d4763a' },
  { id: 'cat-finance', name: 'Finance', icon: 'lucide:landmark', color: '#eab308' },
]

export function loadData(): PersistedData {
  const storage = getStorage()
  const data = storage.get<PersistedData>(DATA_KEY)
  if (data?.entries && data?.categories) return data
  return { entries: [], categories: DEFAULT_CATEGORIES }
}

export function saveData(data: PersistedData): void {
  getStorage().set(DATA_KEY, data)
}

export function createEntry(
  name: string,
  url: string,
  username: string,
  password: string,
  notes = '',
  categoryId: string | null = null,
): VaultEntry {
  return {
    id: generateId(),
    name: name.trim(),
    url: url.trim(),
    username: username.trim(),
    password,
    notes: notes.trim(),
    categoryId,
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createCategory(name: string, icon = 'lucide:folder', color = '#636363'): Category {
  return { id: generateId(), name: name.trim(), icon, color }
}

export const PASSWORD_CHARS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}

export function generatePassword(
  length: number,
  options: {
    uppercase: boolean
    lowercase: boolean
    digits: boolean
    special: boolean
  },
): string {
  let pool = ''
  if (options.uppercase) pool += PASSWORD_CHARS.uppercase
  if (options.lowercase) pool += PASSWORD_CHARS.lowercase
  if (options.digits) pool += PASSWORD_CHARS.digits
  if (options.special) pool += PASSWORD_CHARS.special

  if (!pool) pool = PASSWORD_CHARS.lowercase

  let password = ''
  for (let i = 0; i < length; i++) {
    password += pool[Math.floor(Math.random() * pool.length)]
  }
  return password
}

export function strengthScore(password: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password) && /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) score++

  if (score > 4) score = 4

  const labels = ['Weak', 'Moderate', 'Good', 'Strong', 'Very Strong']
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#22c55e']

  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score]!, color: colors[score]! }
}

export function getFaviconUrl(url: string): string {
  try {
    const origin = url.startsWith('http') ? new URL(url).origin : `https://${url.split('/')[0]}`
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`
  } catch {
    return ''
  }
}
