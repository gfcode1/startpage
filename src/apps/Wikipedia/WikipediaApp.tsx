import { useState, useEffect, useRef, useCallback } from 'react'
import DOMPurify from 'dompurify'
import { GfIcon } from '../../framework/iconSystem'
import { GfEmptyState } from '../../framework/components/EmptyState'
import { useTopbar } from '../../framework/TopbarContext'
import { searchWikipedia, fetchArticleSummary } from './api'
import type { SearchResult, ArticleSummary } from './types'
import './WikipediaApp.css'

export default function WikipediaApp() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<ArticleSummary | null>(null)
  const [articleLoading, setArticleLoading] = useState(false)
  const [articleError, setArticleError] = useState(false)
  const { setActions, setSearch, clearConfig } = useTopbar()
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const doSearch = useCallback(async (query: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSearching(true)
    setSearchError(false)
    setSelectedArticle(null)

    try {
      const data = await searchWikipedia(query, controller.signal)
      if (!controller.signal.aborted) {
        setResults(data.pages)
        setSearching(false)
      }
    } catch (err) {
      if (!controller.signal.aborted && !(err instanceof DOMException && err.name === 'AbortError')) {
        setSearchError(true)
        setSearching(false)
      }
    }
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      abortRef.current?.abort()
      setResults([])
      setSearching(false)
      setSearchError(false)
      setSelectedArticle(null)
      return
    }
    debounceRef.current = setTimeout(() => doSearch(value.trim()), 300)
  }, [doSearch])

  const handleRefresh = useCallback(() => {
    if (searchQuery.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      doSearch(searchQuery.trim())
    }
  }, [doSearch, searchQuery])

  useEffect(() => {
    setActions([
      { id: 'refresh', icon: 'refresh', label: 'Refresh', onClick: handleRefresh },
    ])
    setSearch({ placeholder: 'Search Wikipedia...', value: searchQuery, onChange: handleSearchChange })
    return () => { clearConfig() }
  }, [searchQuery, setActions, setSearch, clearConfig, handleRefresh, handleSearchChange])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const handleSelectArticle = useCallback(async (result: SearchResult) => {
    setSelectedArticle(null)
    setArticleLoading(true)
    setArticleError(false)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const summary = await fetchArticleSummary(result.title, controller.signal)
      if (!controller.signal.aborted) {
        setSelectedArticle(summary)
        setArticleLoading(false)
      }
    } catch (err) {
      if (!controller.signal.aborted && !(err instanceof DOMException && err.name === 'AbortError')) {
        setArticleError(true)
        setArticleLoading(false)
      }
    }
  }, [])

  const handleBack = useCallback(() => {
    setSelectedArticle(null)
    setArticleLoading(false)
    setArticleError(false)
  }, [])

  const noQuery = !searchQuery.trim()
  const showArticle = selectedArticle && !articleLoading
  const showArticleLoading = articleLoading
  const showArticleError = articleError
  const showResults = !noQuery && !searching && !searchError && results.length > 0 && !selectedArticle && !articleLoading
  const showEmpty = !noQuery && !searching && !searchError && results.length === 0 && !selectedArticle
  const showWelcome = noQuery && !selectedArticle

  return (
    <div className="gf-wikipedia">
      {showWelcome && (
        <GfEmptyState
          icon={<GfIcon name="search" size={24} />}
          title="Search Wikipedia"
          description="Find articles, people, places and more from English Wikipedia"
        />
      )}

      {searching && (
        <div className="gf-wikipedia__loading">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="gf-wikipedia__skeleton-card">
              <div className="gf-wikipedia__skeleton-thumb" />
              <div className="gf-wikipedia__skeleton-body">
                <div className="gf-wikipedia__skeleton-line gf-wikipedia__skeleton-line--lg" />
                <div className="gf-wikipedia__skeleton-line" />
                <div className="gf-wikipedia__skeleton-line gf-wikipedia__skeleton-line--sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {searchError && (
        <div className="gf-wikipedia__error">
          <GfIcon name="alert" size={14} />
          <span>Search failed. Try again.</span>
          <button className="gf-wikipedia__retry-btn" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      )}

      {showEmpty && (
        <GfEmptyState
          icon={<GfIcon name="search" size={24} />}
          title="No results found"
          description={`No articles match "${searchQuery}". Try a different search term.`}
        />
      )}

      {showResults && (
        <div className="gf-wikipedia__results">
          {results.map(result => (
            <div
              key={result.id}
              className="gf-wikipedia__card"
              onClick={() => handleSelectArticle(result)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectArticle(result) } }}
            >
              {result.thumbnail ? (
                <img className="gf-wikipedia__card-thumb" src={result.thumbnail.url} alt="" loading="lazy" />
              ) : (
                <div className="gf-wikipedia__card-thumb gf-wikipedia__card-thumb--empty">
                  <GfIcon name="book-open" size={20} />
                </div>
              )}
              <div className="gf-wikipedia__card-body">
                <h3 className="gf-wikipedia__card-title">{result.title}</h3>
                {result.description && (
                  <p className="gf-wikipedia__card-desc">{result.description}</p>
                )}
                <p className="gf-wikipedia__card-excerpt">{result.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showArticleLoading && (
        <div className="gf-wikipedia__article-loading">
          <div className="gf-wikipedia__skeleton-hero" />
          <div className="gf-wikipedia__skeleton-line gf-wikipedia__skeleton-line--lg" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="gf-wikipedia__skeleton-line" />
          ))}
        </div>
      )}

      {showArticleError && (
        <div className="gf-wikipedia__error">
          <GfIcon name="alert" size={14} />
          <span>Failed to load article.</span>
          <button className="gf-wikipedia__retry-btn" onClick={handleBack}>
            Go back
          </button>
        </div>
      )}

      {showArticle && selectedArticle && (
        <article className="gf-wikipedia__article">
          <button className="gf-wikipedia__back-btn" onClick={handleBack}>
            <GfIcon name="chevron-left" size={14} />
            Back to results
          </button>

          {selectedArticle.originalimage && (
            <div className="gf-wikipedia__article-hero">
              <img
                className="gf-wikipedia__article-hero-img"
                src={selectedArticle.originalimage.source}
                alt=""
                loading="lazy"
              />
            </div>
          )}

          <div className="gf-wikipedia__article-content">
            <h1 className="gf-wikipedia__article-title" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.displaytitle) }} />
            {selectedArticle.description && (
              <p className="gf-wikipedia__article-desc">{selectedArticle.description}</p>
            )}

            <div className="gf-wikipedia__article-extract">
              {selectedArticle.extract.split('\n').map((para, i) => (
                para.trim() ? <p key={i}>{para}</p> : null
              ))}
            </div>

            <a
              className="gf-wikipedia__article-link"
              href={selectedArticle.content_urls.desktop.page}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GfIcon name="external-link" size={14} />
              Open on Wikipedia
            </a>
          </div>
        </article>
      )}
    </div>
  )
}
