import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Thread, Message, ChatStore } from './types'
import {
  loadData,
  saveData,
  createThread as createThreadUtil,
  createMessage as createMessageUtil,
  buildMessagesForApi,
  loadGlobalModel,
  saveGlobalModel,
} from './utils'
import { streamChatCompletion, fetchModels } from './openrouter'
import type { StoreApi } from 'zustand'

const initialData = loadData()

function persist(state: { threads: Thread[]; messages: Message[] }) {
  saveData({ threads: state.threads, messages: state.messages })
}

let activeAbortFn: (() => void) | null = null

function startStream(
  set: StoreApi<ChatStore>['setState'],
  apiMessages: { role: string; content: string }[],
  model: string,
  threadId: string,
  temperature?: number,
  topP?: number,
) {
  activeAbortFn?.()
  activeAbortFn = streamChatCompletion(
    apiMessages,
    model,
    {
      onToken: (token) => {
        set((s) => {
          if (s.streamingThreadId !== threadId) return {}
          return { streamingContent: s.streamingContent + token }
        })
      },
      onDone: (fullContent) => {
        set((s) => {
          if (s.streamingThreadId !== threadId) return {}
          const assistantMessage = createMessageUtil(threadId, 'assistant', fullContent)
          const newMessages = [...s.messages, assistantMessage]
          const newThreads = s.threads.map((t) =>
            t.id === threadId ? { ...t, updatedAt: Date.now() } : t,
          )
          persist({ threads: newThreads, messages: newMessages })
          return {
            messages: newMessages,
            threads: newThreads,
            streamingThreadId: null,
            streamingContent: '',
          }
        })
        activeAbortFn = null
      },
      onError: (err) => {
        set((s) => {
          if (s.streamingThreadId !== threadId) return {}
          return { error: err.message, streamingThreadId: null, streamingContent: '' }
        })
        activeAbortFn = null
      },
    },
    { temperature, topP },
  )
}

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    threads: initialData.threads,
    messages: initialData.messages,
    selectedThreadId: null,
    streamingThreadId: null,
    streamingContent: '',
    error: null,
    modelsCache: [],
    modelsLoading: false,
    globalModel: loadGlobalModel(),

    createThread: () => {
      const thread = createThreadUtil()
      set((state) => {
        const newState = { threads: [thread, ...state.threads], selectedThreadId: thread.id }
        persist({ threads: newState.threads, messages: state.messages })
        return newState
      })
      return thread
    },

    deleteThread: (id) => {
      set((state) => {
        const newThreads = state.threads.filter((t) => t.id !== id)
        const newMessages = state.messages.filter((m) => m.threadId !== id)
        const newSelected = state.selectedThreadId === id ? null : state.selectedThreadId
        persist({ threads: newThreads, messages: newMessages })
        return { threads: newThreads, messages: newMessages, selectedThreadId: newSelected }
      })
    },

    renameThread: (id, name) => {
      set((state) => {
        const newThreads = state.threads.map((t) => (t.id === id ? { ...t, name, updatedAt: Date.now() } : t))
        persist({ threads: newThreads, messages: state.messages })
        return { threads: newThreads }
      })
    },

    selectThread: (id) => set({ selectedThreadId: id }),

    setGlobalModel: (model) => {
      saveGlobalModel(model)
      set({ globalModel: model })
    },

    updateThreadSettings: (id, settings) => {
      set((state) => {
        const newThreads = state.threads.map((t) =>
          t.id === id ? { ...t, ...settings, updatedAt: Date.now() } : t,
        )
        persist({ threads: newThreads, messages: state.messages })
        return { threads: newThreads }
      })
    },

    deleteMessage: (messageId) => {
      set((state) => {
        const newMessages = state.messages.filter((m) => m.id !== messageId)
        persist({ threads: state.threads, messages: newMessages })
        return { messages: newMessages }
      })
    },

    sendMessage: async (content, modelOverride) => {
      const state = get()
      let threadId = state.selectedThreadId

      if (!threadId) {
        const newThread = get().createThread()
        threadId = newThread.id
      }

      const thread = get().threads.find((t) => t.id === threadId)
      if (!thread) return

      const model = modelOverride || get().globalModel

      const userMessage = createMessageUtil(threadId, 'user', content)

      set((s) => {
        const newMessages = [...s.messages, userMessage]
        const newThreads = s.threads.map((t) =>
          t.id === threadId ? { ...t, updatedAt: Date.now() } : t,
        )
        persist({ threads: newThreads, messages: newMessages })
        return { messages: newMessages, threads: newThreads, streamingThreadId: threadId, streamingContent: '', error: null }
      })

      const threadMessages = get().messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt - b.createdAt)

      const apiMessages = buildMessagesForApi(threadMessages, thread.systemPrompt)

      startStream(set, apiMessages, model, threadId, thread.temperature, thread.topP)
    },

    stopStreaming: () => {
      const state = get()
      if (!state.streamingThreadId || !state.streamingContent) return
      const threadId = state.streamingThreadId
      const partialContent = state.streamingContent

      if (activeAbortFn) {
        activeAbortFn()
        activeAbortFn = null
      }

      const assistantMessage = createMessageUtil(threadId, 'assistant', partialContent + '\n\n*[stopped]*')
      set((s) => {
        const newMessages = [...s.messages, assistantMessage]
        persist({ threads: s.threads, messages: newMessages })
        return { messages: newMessages, streamingThreadId: null, streamingContent: '' }
      })
    },

    regenerateLast: async (threadId) => {
      const state = get()
      const threadMessages = state.messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt - b.createdAt)

      const lastAssistantIdx = [...threadMessages].reverse().findIndex((m) => m.role === 'assistant')
      if (lastAssistantIdx === -1) return

      const msgs = threadMessages.slice(0, threadMessages.length - 1 - lastAssistantIdx)
      const lastUserMsg = threadMessages[threadMessages.length - 2 - lastAssistantIdx]
      if (!lastUserMsg) return

      const lastAssistant = threadMessages[threadMessages.length - 1 - lastAssistantIdx]
      if (!lastAssistant) return

      set((s) => {
        const newMessages = s.messages.filter((m) => m.id !== lastAssistant.id)
        persist({ threads: s.threads, messages: newMessages })
        return { messages: newMessages, streamingThreadId: threadId, streamingContent: '', error: null }
      })

      const thread = get().threads.find((t) => t.id === threadId)
      const apiMessages = buildMessagesForApi(
        msgs.filter((m) => m.id !== lastAssistant.id),
        thread?.systemPrompt,
      )

      startStream(set, apiMessages, get().globalModel, threadId, thread?.temperature, thread?.topP)
    },

    editAndResend: async (messageId, newContent) => {
      const state = get()
      const msg = state.messages.find((m) => m.id === messageId)
      if (!msg || msg.role !== 'user') return

      const threadId = msg.threadId
      const threadMessages = state.messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt - b.createdAt)

      const idx = threadMessages.findIndex((m) => m.id === messageId)
      if (idx === -1) return

      const messagesToRemove = threadMessages.slice(idx).map((m) => m.id)

      set((s) => {
        const newMessages = s.messages
          .filter((m) => !messagesToRemove.includes(m.id))
          .concat(createMessageUtil(threadId, 'user', newContent))
        persist({ threads: s.threads, messages: newMessages })
        return { messages: newMessages, streamingThreadId: threadId, streamingContent: '', error: null }
      })

      const thread = get().threads.find((t) => t.id === threadId)
      const rebuiltMessages = get().messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt - b.createdAt)

      const apiMessages = buildMessagesForApi(rebuiltMessages, thread?.systemPrompt)

      startStream(set, apiMessages, get().globalModel, threadId, thread?.temperature, thread?.topP)
    },

    loadModels: async () => {
      set({ modelsLoading: true })
      try {
        const models = await fetchModels()
        set({ modelsCache: models, modelsLoading: false })
      } catch {
        set({ modelsLoading: false })
      }
    },

    clearError: () => set({ error: null }),

    getThreadMessages: (threadId) => {
      return get().messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt - b.createdAt)
    },
  })),
)
