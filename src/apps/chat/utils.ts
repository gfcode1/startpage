import { getStorage } from '@/lib/storage/engine'
import { generateId } from '@/lib/utils/id'
import type { Thread, Message, PersistedData } from './types'

const DATA_KEY = 'chat:data'
const API_KEY_KEY = 'chat:apikey'
const MODEL_KEY = 'chat:model'
export const DEFAULT_MODEL = 'openai/gpt-4o'

export function loadData(): PersistedData {
  const storage = getStorage()
  const data = storage.get<PersistedData>(DATA_KEY)
  if (data?.threads && data?.messages) return data
  return { threads: [], messages: [] }
}

export function saveData(data: PersistedData): void {
  getStorage().set(DATA_KEY, data)
}

export function getApiKey(): string {
  return getStorage().get<string>(API_KEY_KEY) || ''
}

export function setApiKey(key: string): void {
  getStorage().set(API_KEY_KEY, key)
}

export function createThread(name?: string): Thread {
  return {
    id: generateId(),
    name: name || 'New Chat',
    systemPrompt: '',
    temperature: 0.7,
    topP: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createMessage(threadId: string, role: Message['role'], content: string): Message {
  return {
    id: generateId(),
    threadId,
    role,
    content,
    createdAt: Date.now(),
  }
}

export function buildMessagesForApi(
  messages: Message[],
  systemPrompt?: string,
): { role: string; content: string }[] {
  const result: { role: string; content: string }[] = []
  if (systemPrompt) {
    result.push({ role: 'system', content: systemPrompt })
  }
  for (const m of messages) {
    if (m.role === 'system') continue
    result.push({ role: m.role, content: m.content })
  }
  return result
}

export function estimateTokens(text: string): number {
  const bytes = new TextEncoder().encode(text).length
  return Math.ceil(bytes / 4)
}

export function loadGlobalModel(): string {
  return getStorage().get<string>(MODEL_KEY) || DEFAULT_MODEL
}

export function saveGlobalModel(model: string): void {
  getStorage().set(MODEL_KEY, model)
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'short' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
