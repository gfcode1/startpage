import { useState, useCallback } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import { useWidgetOptions } from '../../framework/WidgetOptionsContext'
import { WidgetOptionsPopup } from '../../framework/components/WidgetOptionsPopup'
import './SearchWidget.css'

const WIDGET_ID = 'search'

const SEARCH_URLS: Record<string, (q: string) => string> = {
  google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  duckduckgo: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  bing: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  brave: q => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
  ecosia: q => `https://www.ecosia.org/search?q=${encodeURIComponent(q)}`,
  startpage: q => `https://www.startpage.com/do/dsearch?query=${encodeURIComponent(q)}`,
}

const ASK_URLS: Record<string, (q: string) => string> = {
  perplexity: q => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`,
  chatgpt: q => `https://chatgpt.com/?q=${encodeURIComponent(q)}`,
  gemini: q => `https://gemini.google.com/?q=${encodeURIComponent(q)}`,
  claude: q => `https://claude.ai/?q=${encodeURIComponent(q)}`,
  copilot: q => `https://copilot.microsoft.com/?q=${encodeURIComponent(q)}`,
}

export default function SearchWidget() {
  const [query, setQuery] = useState('')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const { options } = useWidgetOptions(WIDGET_ID)

  const searchEngine = String(options.searchEngine ?? 'google')
  const askProvider = String(options.askProvider ?? 'perplexity')
  const openInNewTab = options.openInNewTab !== false

  const openUrl = useCallback((url: string) => {
    if (openInNewTab) {
      window.open(url, '_blank', 'noopener')
    } else {
      window.location.href = url
    }
  }, [openInNewTab])

  const handleSearch = useCallback(() => {
    const q = query.trim()
    if (!q) return
    const builder = SEARCH_URLS[searchEngine]
    if (builder) openUrl(builder(q))
  }, [query, searchEngine, openUrl])

  const handleAsk = useCallback(() => {
    const q = query.trim()
    if (!q) return
    const builder = ASK_URLS[askProvider]
    if (builder) openUrl(builder(q))
  }, [query, askProvider, openUrl])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }, [handleSearch])

  return (
    <div className="gf-widget-search">
      <button
        className="gf-widget-search__options-btn"
        onClick={() => setOptionsOpen(true)}
        aria-label="Search & Ask options"
        title="Search & Ask options"
      >
        <GfIcon name="settings" size={14} />
      </button>

      <div className="gf-widget-search__bar">
        <input
          className="gf-widget-search__input"
          type="text"
          placeholder="Search the web or ask an LLM..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search or ask"
        />
        <div className="gf-widget-search__actions">
          <button className="gf-widget-search__btn gf-widget-search__btn--ask" onClick={handleAsk} aria-label="Ask">
            <GfIcon name="sparkles" size={14} />
            <span>Ask</span>
          </button>
          <button className="gf-widget-search__btn gf-widget-search__btn--search" onClick={handleSearch} aria-label="Search">
            <GfIcon name="search" size={14} />
            <span>Search</span>
          </button>
        </div>
      </div>

      <WidgetOptionsPopup
        widgetId={WIDGET_ID}
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
      />
    </div>
  )
}
