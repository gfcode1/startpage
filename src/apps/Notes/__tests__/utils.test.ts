import { describe, it, expect } from 'vitest'
import { renderMarkdown, generateId, formatDate, getPreview, highlightSearch, getFoldersFromNotes } from '../utils'

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string')
  })

  it('returns unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe('formatDate', () => {
  it('returns a string', () => {
    expect(typeof formatDate(Date.now())).toBe('string')
  })

  it('returns non-empty for valid timestamp', () => {
    expect(formatDate(Date.now()).length).toBeGreaterThan(0)
  })
})

describe('renderMarkdown', () => {
  it('renders bold markdown', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>')
  })

  it('renders italic markdown', () => {
    expect(renderMarkdown('*italic*')).toContain('<em>italic</em>')
  })

  it('renders heading', () => {
    expect(renderMarkdown('# Heading')).toContain('<h1')
  })

  it('renders code block', () => {
    const result = renderMarkdown('```\ncode\n```')
    expect(result).toContain('<code')
  })

  it('returns empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('')
  })

  it('renders link', () => {
    const result = renderMarkdown('[text](https://example.com)')
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('>text<')
  })

  it('renders list', () => {
    const result = renderMarkdown('- item\n- another')
    expect(result).toContain('<li>item</li>')
    expect(result).toContain('<li>another</li>')
  })
})

describe('getPreview', () => {
  it('strips markdown formatting', () => {
    const result = getPreview('**bold** and *italic*')
    expect(result).not.toContain('**')
    expect(result).toContain('bold')
    expect(result).toContain('italic')
  })

  it('respects max length', () => {
    const result = getPreview('a'.repeat(500), 10)
    expect(result.length).toBeLessThanOrEqual(10)
  })

  it('handles empty content', () => {
    expect(getPreview('')).toBe('')
  })

  it('strips headings', () => {
    expect(getPreview('# Heading')).not.toContain('#')
  })

  it('strips links but keeps text', () => {
    expect(getPreview('[text](url)')).toContain('text')
  })
})

describe('highlightSearch', () => {
  it('wraps match in mark tag', () => {
    const result = highlightSearch('Hello World', 'world')
    expect(result).toContain('<mark>World</mark>')
  })

  it('is case insensitive', () => {
    const result = highlightSearch('Hello World', 'hello')
    expect(result).toContain('<mark>Hello</mark>')
  })

  it('returns original text when query is empty', () => {
    expect(highlightSearch('Hello', '')).toBe('Hello')
  })

  it('escapes regex special characters', () => {
    const result = highlightSearch('price is $10.00', '$10')
    expect(result).toContain('<mark>$10</mark>')
  })

  it('handles no match gracefully', () => {
    expect(highlightSearch('Hello', 'xyz')).toBe('Hello')
  })
})

describe('getFoldersFromNotes', () => {
  it('returns sorted unique folder names', () => {
    const notes = [
      { folder: 'work' },
      { folder: 'personal' },
      { folder: 'work' },
      { folder: '' },
      { folder: 'archive' },
    ] as { folder: string }[]
    expect(getFoldersFromNotes(notes)).toEqual(['archive', 'personal', 'work'])
  })

  it('returns empty array when no folders', () => {
    const notes = [
      { folder: '' },
      { folder: '' },
    ] as { folder: string }[]
    expect(getFoldersFromNotes(notes)).toEqual([])
  })

  it('returns empty array for empty input', () => {
    expect(getFoldersFromNotes([])).toEqual([])
  })
})
