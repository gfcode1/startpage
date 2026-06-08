import { useRef, useEffect } from 'react'
import { GfIcon } from '../../framework/iconSystem'
import type { CityResult } from './types'

interface WeatherTopbarSearchProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchResults: CityResult[]
  showResults: boolean
  onCloseResults: () => void
  searchIndex: number
  onHoverResult: (index: number) => void
  searching: boolean
  geoLoading: boolean
  onKeyDown: (e: React.KeyboardEvent) => void
  onSelectCity: (result: CityResult) => void
  onGeoRequest: () => void
  onClear: () => void
  onFocusSearch: () => void
}

export function WeatherTopbarSearch({
  searchQuery,
  onSearchChange,
  searchResults,
  showResults,
  onCloseResults,
  searchIndex,
  onHoverResult,
  searching,
  geoLoading,
  onKeyDown,
  onSelectCity,
  onGeoRequest,
  onClear,
  onFocusSearch,
}: WeatherTopbarSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCloseResults()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onCloseResults])

  useEffect(() => {
    if (searchIndex < 0 || !dropdownRef.current) return
    const items = dropdownRef.current.querySelectorAll<HTMLButtonElement>('.gf-weather__search-item')
    items[searchIndex]?.scrollIntoView({ block: 'nearest' })
  }, [searchIndex])

  return (
    <div className="gf-topbar-weather-search" ref={containerRef}>
      <div className="gf-weather__search-bar">
        <GfIcon name="search" size={14} className="gf-weather__search-icon" />
        <input
          ref={inputRef}
          className="gf-weather__search-input"
          type="text"
          placeholder="Search city..."
          aria-label="Search city"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          onFocus={onFocusSearch}
          onKeyDown={onKeyDown}
        />
        {searchQuery && (
          <button
            className="gf-weather__clear-btn"
            onClick={onClear}
            aria-label="Clear search"
          >
            <GfIcon name="close" size={12} />
          </button>
        )}
        <button
          className={`gf-weather__geo-btn ${geoLoading ? 'gf-weather__geo-btn--loading' : ''}`}
          onClick={onGeoRequest}
          disabled={geoLoading}
          aria-label="Current location"
        >
          <GfIcon name="globe" size={14} />
        </button>
        {searching && (
          <div className="gf-weather__search-dropdown">
            <div className="gf-weather__search-loading">Searching...</div>
          </div>
        )}
        {!searching && searchResults.length > 0 && showResults && (
          <div className="gf-weather__search-dropdown" ref={dropdownRef}>
            {searchResults.map((r, i) => (
              <button
                key={r.id}
                className={`gf-weather__search-item${i === searchIndex ? ' gf-weather__search-item--active' : ''}`}
                onClick={() => onSelectCity(r)}
                onMouseEnter={() => onHoverResult(i)}
              >
                <span className="gf-weather__search-item-name">
                  {r.name}{r.admin1 ? `, ${r.admin1}` : ''}
                </span>
                <span className="gf-weather__search-item-country">{r.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
