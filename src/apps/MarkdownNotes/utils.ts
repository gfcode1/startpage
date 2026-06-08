import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
}))

export function renderMarkdown(md: string): string {
  const result = marked.parse(md)
  return typeof result === 'string' ? result : ''
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getPreview(content: string, maxLen = 200): string {
  return content
    .replace(/^#+\s+/gm, '')
    .replace(/\*{1,2}(.+?)\*{1,2}/g, '$1')
    .replace(/_{1,2}(.+?)_{1,2}/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`{1,3}.+?`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\n{2,}/g, ' ')
    .trim()
    .slice(0, maxLen)
}

export function highlightSearch(text: string, query: string): string {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

export function getFoldersFromNotes(notes: { folder: string }[]): string[] {
  const set = new Set(notes.map(n => n.folder).filter(Boolean))
  return Array.from(set).sort()
}
