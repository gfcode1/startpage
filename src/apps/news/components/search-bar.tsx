import { TextInput } from '@mantine/core'
import { Icon } from '@iconify/react'
import { useNewsStore } from '@/stores/news-store'
import { useState, useRef, useCallback } from 'react'

export function SearchBar() {
  const searchQuery = useNewsStore((s) => s.searchQuery)
  const setSearchQuery = useNewsStore((s) => s.setSearchQuery)
  const [local, setLocal] = useState(searchQuery)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleChange = useCallback((value: string) => {
    setLocal(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSearchQuery(value), 300)
  }, [setSearchQuery])

  return (
    <TextInput
      placeholder="Search articles..."
      value={local}
      onChange={(e) => handleChange(e.currentTarget.value)}
      leftSection={<Icon icon="lucide:search" width={16} />}
      size="sm"
      style={{ flex: 1, maxWidth: 400 }}
    />
  )
}
