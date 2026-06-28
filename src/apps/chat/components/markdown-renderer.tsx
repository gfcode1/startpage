import { useEffect, useMemo, useRef } from 'react'
import { Box } from '@mantine/core'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Prism from 'prismjs'
import 'prismjs/themes/prism-okaidia.css'

interface MarkdownRendererProps {
  content: string
}

const COPY_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>'
const CHECK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'

function addCopyButtons(container: HTMLElement) {
  const blocks = container.querySelectorAll('pre')
  for (const pre of blocks) {
    if (pre.querySelector('.copy-btn')) continue
    const wrapper = document.createElement('div')
    wrapper.style.position = 'relative'
    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.innerHTML = COPY_ICON_SVG
    btn.title = 'Copy code'
    btn.onclick = () => {
      const code = pre.querySelector('code')
      if (code) {
        navigator.clipboard.writeText(code.textContent || '')
        btn.innerHTML = CHECK_SVG
        setTimeout(() => {
          btn.innerHTML = COPY_ICON_SVG
        }, 2000)
      }
    }
    pre.parentNode?.insertBefore(wrapper, pre)
    wrapper.appendChild(pre)
    wrapper.appendChild(btn)
  }
}

let stylesInjected = false
const STYLES_ID = 'chat-markdown-styles'

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const html = useMemo(() => {
    const raw = marked.parse(content, { breaks: true }) as string
    return DOMPurify.sanitize(raw)
  }, [content])

  useEffect(() => {
    if (!stylesInjected) {
      stylesInjected = true
      const style = document.createElement('style')
      style.id = STYLES_ID
      style.textContent = `
        .chat-markdown { line-height: 1.7; word-break: break-word; }
        .chat-markdown p { margin: 0 0 0.5em; }
        .chat-markdown p:last-child { margin-bottom: 0; }
        .chat-markdown code { background: rgba(127,127,127,0.15); padding: 2px 6px; border-radius: 4px; font-size: 0.875em; }
        .chat-markdown pre { border-radius: 8px; margin: 0.75em 0; overflow-x: auto; }
        .chat-markdown pre code { background: none; padding: 0; font-size: 0.8125em; }
        .chat-markdown table { border-collapse: collapse; width: 100%; margin: 0.75em 0; }
        .chat-markdown th, .chat-markdown td { border: 1px solid rgba(127,127,127,0.3); padding: 6px 12px; text-align: left; }
        .chat-markdown th { background: rgba(127,127,127,0.1); }
        .chat-markdown ul, .chat-markdown ol { padding-left: 1.5em; margin: 0.5em 0; }
        .chat-markdown li { margin: 0.25em 0; }
        .chat-markdown blockquote { border-left: 3px solid var(--mantine-color-dimmed); padding-left: 1em; margin: 0.75em 0; opacity: 0.85; }
        .chat-markdown h1, .chat-markdown h2, .chat-markdown h3, .chat-markdown h4 { margin: 1em 0 0.5em; }
        .chat-markdown h1 { font-size: 1.5em; }
        .chat-markdown h2 { font-size: 1.25em; }
        .chat-markdown h3 { font-size: 1.1em; }
        .chat-markdown a { color: var(--mantine-color-anchor); }
        .copy-btn { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.3); border: none; color: #ccc; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
        .copy-btn:hover { background: rgba(0,0,0,0.5); color: #fff; }
        div:hover > .copy-btn { opacity: 1; }
      `
      document.head.appendChild(style)
    }

    if (!containerRef.current) return
    addCopyButtons(containerRef.current)
    const codes = containerRef.current.querySelectorAll('pre code')
    for (const code of codes) {
      Prism.highlightElement(code)
    }
  }, [html])

  return (
    <Box
      ref={containerRef}
      className="chat-markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
