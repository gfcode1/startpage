import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { theme } from './theme'
import { App } from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <QueryClientProvider client={queryClient}>
          <Notifications position="bottom-right" />
          <App />
        </QueryClientProvider>
      </MantineProvider>
    </StrictMode>,
  )
}
