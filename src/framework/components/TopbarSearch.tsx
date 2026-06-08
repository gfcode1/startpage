import { useState, useRef, useEffect, useCallback } from 'react'
import { GfIcon } from '../iconSystem'
import type { TopbarSearch as TopbarSearchConfig } from '../TopbarContext'
import './TopbarSearch.css'

interface TopbarSearchProps {
  search: TopbarSearchConfig
}

export function TopbarSearch({ search }: TopbarSearchProps) {
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus()
    }
  }, [expanded])

  useEffect(() => {
    if (!expanded) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setExpanded(false)
        search.onChange('')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [expanded, search])

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setExpanded(false)
    }
  }, [])

  return (
    <div className="gf-topbar-search" ref={containerRef}>
      {expanded ? (
        <div className="gf-topbar-search__input-wrap">
          <GfIcon name="search" size={14} className="gf-topbar-search__icon" />
          <input
            ref={inputRef}
            className="gf-topbar-search__input"
            type="text"
            placeholder={search.placeholder}
            aria-label={search.placeholder}
            value={search.value}
            onChange={e => search.onChange(e.target.value)}
            onBlur={handleBlur}
          />
          {search.value && (
            <button
              className="gf-topbar-search__clear"
              onClick={() => search.onChange('')}
              aria-label="Clear search"
            >
              <GfIcon name="close" size={12} />
            </button>
          )}
        </div>
      ) : (
        <button
          className="gf-topbar-search__btn"
          onClick={() => setExpanded(true)}
          aria-label="Search"
          title="Search"
        >
          <GfIcon name="search" size={16} />
        </button>
      )}
    </div>
  )
}
