export interface Message {
  id: string
  threadId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
}

export interface Thread {
  id: string
  name: string
  systemPrompt: string
  temperature: number
  topP: number
  createdAt: number
  updatedAt: number
}

export interface PersistedData {
  threads: Thread[]
  messages: Message[]
}

export interface OpenRouterModel {
  id: string
  name: string
  description?: string
  context_length?: number
  pricing?: {
    prompt: string
    completion: string
  }
}

export interface ChatStoreState {
  threads: Thread[]
  messages: Message[]
  selectedThreadId: string | null
  streamingThreadId: string | null
  streamingContent: string
  error: string | null
  modelsCache: OpenRouterModel[]
  modelsLoading: boolean
  globalModel: string
}

export interface ChatStoreActions {
  createThread: () => Thread
  deleteThread: (id: string) => void
  renameThread: (id: string, name: string) => void
  selectThread: (id: string | null) => void
  updateThreadSettings: (id: string, settings: Partial<Pick<Thread, 'systemPrompt' | 'temperature' | 'topP' | 'name'>>) => void
  setGlobalModel: (model: string) => void
  sendMessage: (content: string, modelOverride?: string) => Promise<void>
  stopStreaming: () => void
  regenerateLast: (threadId: string) => Promise<void>
  editAndResend: (messageId: string, newContent: string) => Promise<void>
  deleteMessage: (messageId: string) => void
  loadModels: () => Promise<void>
  clearError: () => void
  getThreadMessages: (threadId: string) => Message[]
}

export type ChatStore = ChatStoreState & ChatStoreActions
