import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const redirect = sessionStorage.getItem('redirect')
sessionStorage.removeItem('redirect')
if (redirect) {
  const url = new URL(redirect)
  if (url.pathname !== '/') {
    history.replaceState(null, '', url.pathname + url.search + url.hash)
  }
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
