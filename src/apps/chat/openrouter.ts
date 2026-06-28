import type { OpenRouterModel } from './types'
import { getApiKey } from './utils'

const BASE_URL = 'https://openrouter.ai/api/v1'

async function openRouterFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('No API key set. Configure it in the API Key settings.')

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    signal: init?.signal,
  })

  if (!res.ok) {
    const body = await res.text()
    let message = `HTTP ${res.status}`
    try {
      const json = JSON.parse(body)
      message = json.error?.message || json.message || message
    } catch { /* ignore */ }
    throw new Error(message)
  }

  return res.json()
}

export async function fetchModels(): Promise<OpenRouterModel[]> {
  const data = await openRouterFetch<{ data: OpenRouterModel[] }>('/models')
  return data.data || []
}

export async function chatCompletion(
  messages: { role: string; content: string }[],
  model: string,
  options?: { temperature?: number; topP?: number },
): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number } }> {
  const body = await openRouterFetch<{
    choices: { message: { content: string } }[]
    usage?: { prompt_tokens: number; completion_tokens: number }
  }>('/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      top_p: options?.topP ?? 1,
    }),
  })

  return {
    content: body.choices[0]?.message?.content || '',
    usage: body.usage,
  }
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: (fullContent: string, usage?: { prompt_tokens: number; completion_tokens: number }) => void
  onError: (error: Error) => void
}

export function streamChatCompletion(
  messages: { role: string; content: string }[],
  model: string,
  callbacks: StreamCallbacks,
  options?: { temperature?: number; topP?: number },
): () => void {
  const apiKey = getApiKey()
  if (!apiKey) {
    callbacks.onError(new Error('No API key set'))
    return () => {}
  }

  const controller = new AbortController()
  const signal = controller.signal

  fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: options?.temperature ?? 0.7,
      top_p: options?.topP ?? 1,
    }),
    signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const body = await response.text()
        let message = `HTTP ${response.status}`
        try {
          const json = JSON.parse(body)
          message = json.error?.message || json.message || message
        } catch { /* ignore */ }
        throw new Error(message)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''
      let usage: { prompt_tokens: number; completion_tokens: number } | undefined

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue
            const data = trimmed.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                fullContent += delta
                callbacks.onToken(delta)
              }
              if (parsed.usage) {
                usage = parsed.usage
              }
            } catch { /* ignore malformed chunks */ }
          }
        }

        callbacks.onDone(fullContent, usage)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        callbacks.onError(err instanceof Error ? err : new Error(String(err)))
      }
    })
    .catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return
      callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    })

  return () => controller.abort()
}
