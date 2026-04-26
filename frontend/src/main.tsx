import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { useAppStore } from './store/useAppStore'
import { queryClient } from './lib/queryClient'

function AuthBootstrap() {
  const bootstrapAuth = useAppStore((state) => state.bootstrapAuth)
  useEffect(() => {
    bootstrapAuth()
  }, [bootstrapAuth])
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthBootstrap />
    </BrowserRouter>
  </StrictMode>,
)
