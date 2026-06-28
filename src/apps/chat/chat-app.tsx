import { useEffect, useRef } from 'react'
import { Box, Drawer, Button } from '@mantine/core'
import { useMediaQuery, useDisclosure } from '@mantine/hooks'
import { Icon } from '@iconify/react'
import { Sidebar } from './components/sidebar'
import { ChatView } from './components/chat-view'
import { useChatStore } from './store'

const SIDEBAR_WIDTH = 280

export default function ChatApp() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const selectThread = useChatStore((s) => s.selectThread)
  const initialized = useRef(false)
  const [drawerOpen, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const threads = useChatStore.getState().threads
    if (threads.length > 0 && threads[0]) {
      selectThread(threads[0].id)
    }
  }, [selectThread])

  if (isMobile) {
    return (
      <Box h="calc(100vh - 120px)" display="flex">
        <Drawer
          opened={drawerOpen}
          onClose={closeDrawer}
          title="Chats"
          size={300}
        >
          <Box h="100%">
            <Sidebar />
          </Box>
        </Drawer>
        <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Box
            p="xs"
            style={{
              borderBottom: '1px solid var(--mantine-color-default-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Button
              variant="subtle"
              size="sm"
              leftSection={<Icon icon="lucide:menu" width={16} />}
              onClick={openDrawer}
            >
              Chats
            </Button>
          </Box>
          <Box style={{ flex: 1, minHeight: 0 }}>
            <ChatView />
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box h="calc(100vh - 120px)" display="flex">
      <Box
        w={SIDEBAR_WIDTH}
        h="100%"
        p="sm"
        style={{ flexShrink: 0, borderRight: '1px solid var(--mantine-color-default-border)' }}
      >
        <Sidebar />
      </Box>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <ChatView />
      </Box>
    </Box>
  )
}
