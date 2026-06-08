import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGfTheme } from '../ThemeProvider'
import { GfIcon } from '../iconSystem'
import { apps } from '../appRegistry'
import './CommandPalette.css'

interface CmdItem {
  id: string
  label: string
  description: string
  keywords: string
  onAction: () => void
  section: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { themeKey, setTheme } = useGfTheme()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands = useMemo<CmdItem[]>(() => {
    const items: CmdItem[] = []

    apps.forEach(a => {
      items.push({
        id: `nav-${a.id}`,
        label: a.name,
        description: a.description,
        keywords: `${a.name} ${a.description} ${a.category}`,
        onAction: () => {
          navigate(a.path)
          onClose()
        },
        section: 'Apps',
      })
    })

    items.push({
      id: 'theme-light',
      label: 'Theme: Light',
      description: themeKey === 'light' ? 'Currently active' : 'Switch to Light theme',
      keywords: 'theme light',
      onAction: () => {
        setTheme('light')
        onClose()
      },
      section: 'Themes',
    })

    items.push({
      id: 'theme-dark',
      label: 'Theme: Dark',
      description: themeKey === 'dark' ? 'Currently active' : 'Switch to Dark theme',
      keywords: 'theme dark',
      onAction: () => {
        setTheme('dark')
        onClose()
      },
      section: 'Themes',
    })

    items.push({
      id: 'go-home',
      label: 'Home',
      description: 'Go to launcher',
      keywords: 'home launcher start',
      onAction: () => {
        navigate('/')
        onClose()
      },
      section: 'Navigation',
    })

    return items
  }, [navigate, onClose, setTheme, themeKey])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(c =>
      c.keywords.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
    )
  }, [query, commands])

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setQuery('')
        setActiveIndex(0)
      })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    queueMicrotask(() => setActiveIndex(0))
  }, [query])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault()
      filtered[activeIndex].onAction()
    }
  }, [filtered, activeIndex])

  const activeCmd = filtered[activeIndex]

  useEffect(() => {
    if (activeCmd && listRef.current) {
      const el = listRef.current.querySelector<HTMLButtonElement>(`[data-id="${activeCmd.id}"]`)
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeCmd])

  if (!open) return null

  const grouped = filtered.reduce<Record<string, CmdItem[]>>((acc, cmd) => {
    if (!acc[cmd.section]) acc[cmd.section] = []
    acc[cmd.section].push(cmd)
    return acc
  }, {})

  let globalIdx = 0

  return (
    <div
      className="gf-cmdk-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="gf-cmdk-modal">
        <div className="gf-cmdk-input-wrap">
          <GfIcon name="search" size={16} />
          <input
            ref={inputRef}
            className="gf-cmdk-input"
            type="text"
            placeholder="Search apps, themes, actions..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search commands"
          />
          <span className="gf-cmdk-hint">ESC</span>
        </div>

        <div className="gf-cmdk-list" ref={listRef}>
          {filtered.length === 0 ? (
            <div className="gf-cmdk-empty">No results for &ldquo;{query}&rdquo;</div>
          ) : (
            Object.entries(grouped).map(([section, items]) => (
              <div key={section}>
                {section && <div className="gf-cmdk-section">{section}</div>}
                {items.map(cmd => {
                  const idx = globalIdx++
                  const active = idx === activeIndex
                  return (
                    <button
                      key={cmd.id}
                      data-id={cmd.id}
                      className={`gf-cmdk-item${active ? ' gf-cmdk-item--active' : ''}`}
                      onClick={cmd.onAction}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <div className="gf-cmdk-item__info">
                        <div className="gf-cmdk-item__label">{cmd.label}</div>
                        <div className="gf-cmdk-item__desc">{cmd.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
