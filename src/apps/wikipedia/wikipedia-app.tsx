import { Container } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { useRef } from 'react'
import { AppHeader } from '@/ui/app-header'
import { SearchBar } from './components/search-bar'
import { SearchResults } from './components/search-results'
import { ArticleView } from './components/article-view'
import { BookmarksView } from './components/bookmarks-view'
import {
  useWikipediaViewMode,
  useWikipediaSetViewMode,
  useWikipediaGoBack,
} from './wikipedia-store'

export default function WikipediaApp() {
  const viewMode = useWikipediaViewMode()
  const setViewMode = useWikipediaSetViewMode()
  const goBack = useWikipediaGoBack()
  const searchRef = useRef<HTMLInputElement>(null)

  useHotkeys([
    ['alt+F', () => searchRef.current?.focus()],
    ['alt+B', () => setViewMode(viewMode === 'bookmarks' ? 'search' : 'bookmarks')],
    ['Escape', () => {
      if (viewMode === 'article') goBack()
      else if (viewMode === 'bookmarks') setViewMode('search')
    }],
  ])

  const actions = [
    {
      id: 'bookmarks',
      label: viewMode === 'bookmarks' ? 'Back to search' : 'Bookmarks',
      icon: viewMode === 'bookmarks' ? 'lucide:search' : 'lucide:bookmark',
      onClick: () => setViewMode(viewMode === 'bookmarks' ? 'search' : 'bookmarks'),
      variant: viewMode === 'bookmarks' ? 'primary' : undefined,
    } as const,
  ]

  return (
    <Container size="md" py="md">
      {viewMode === 'article' ? (
        <ArticleView />
      ) : (
        <>
          <AppHeader
            title="Wikipedia"
            subtitle="Article browser"
            actions={actions}
          />

          {viewMode === 'bookmarks' ? (
            <BookmarksView />
          ) : (
            <>
              <SearchBar />
              <SearchResults />
            </>
          )}
        </>
      )}
    </Container>
  )
}
